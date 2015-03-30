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
    
    this.viewModel = new ViewModel(this.app);
    // TODO Remove test Data
    //this.viewModel.appointments(require('../testdata/calendarAppointments').appointments);
    
    // This title text is dynamic, we need to replace it by a computed observable
    // showing the current date
    var defBackText = backAction.text._initialValue;
    backAction.text = ko.computed(function() {

        var d = this.viewModel.currentDate();
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

        var d = this.viewModel.currentDate();
        if (!d)
            // Fallback to the default link
            return defLink;

        return defLink + d.toISOString();
    }, this);
    
    this.registerHandler({
        target: this.viewModel.currentAppointment,
        handler: function (apt) {
            
            if (!apt)
                return;
            
            // Update URL to match the appointment ID and
            // track it state
            // Get ID from URL, to avoid do anything if the same.
            var aptId = apt.id(),
                found = /appointment\/([^\/]+)\/(\-?\d+)/i.exec(window.location),
                urlId = found && found[2] |0,
                urlDate = found && found[1],
                curDateStr = getDateWithoutTime(this.viewModel.currentDate()).toISOString();

            if (!found ||
                urlId !== aptId.toString() ||
                urlDate !== curDateStr) {
                
                // TODO save a useful state
                // Not for now, is failing, but something based on:
                /*
                var viewstate = {
                    appointment: apt.model.toPlainObject(true)
                };
                */

                // If was a root URL, no ID, just replace current state
                if (urlId === '')
                    this.app.shell.history.replaceState(null, null, 'appointment/' + curDateStr + '/' + aptId);
                else
                    this.app.shell.history.pushState(null, null, 'appointment/' + curDateStr + '/' + aptId);
            }

            // Trigger a layout update, required by the full-height feature
            $(window).trigger('layoutUpdate');
        }.bind(this)
    });
    /*this.currentAppointment.subscribe(function(apt) {

        var newDate = null,
            curDate = this.currentDate();
        
        if (apt && apt.startTime())
            newDate = getDateWithoutTime(apt.startTime());

        // Update date with the new from current appointment
        // or keep the current date, with latest fallback to the current date
        newDate = newDate || curDate || getDateWithoutTime();
        
        if (newDate.toISOString() !== curDate.toISOString()) {
            this.currentDate(newDate);
        }
        
    }, this);
    */

    // Update  on currentDate changes:
    // NOTE: Lot of code shared with calendar.js
    var previousDate = this.viewModel.currentDate();
    previousDate = previousDate && previousDate.toISOString();
    var app = this.app;
    this.registerHandler({
        target: this.viewModel.currentDate,
        handler: function (date) {
            if (!date) {
                this.appointments([]);
                return;
            }

            // IMPORTANT: The date object may be reused and mutated between calls
            // (mostly because the widget I think), so is better to create
            // a clone and avoid getting race-conditions in the data downloading.
            date = new Date(date.toISOString());

            // Avoid duplicated notification, un-changed date
            if (date.toISOString() === previousDate) {
                return;
            }
            previousDate = date.toISOString();

            this.isLoading(true);

            app.model.appointments.getAppointmentsByDate(date)
            .then(function(appointmentsList) {

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

                // New date list must start with the first ID of the list:
                // Put current ID to zero forcing
                // currentAppointment to look for the first in the
                // new list
                this.currentID(0);
                // Update the source, it will update currentAppointment too:
                this.appointments(appointmentsList || []);

                this.isLoading(false);

            }.bind(this))
            .catch(function(err) {

                // Show free on error
                this.appointments([]);
                this.isLoading(false);

                var msg = 'Error loading calendar events.';
                app.modals.showError({
                    title: msg,
                    error: err && err.error || err
                });

            }.bind(this));

        }.bind(this.viewModel)
    });
    
    var ModelVersion = require('../utils/ModelVersion');

    this.registerHandler({
        target: this.viewModel.editMode,
        handler: function(isEdit) {
            this.$activity.toggleClass('in-edit', isEdit);
            this.$appointmentView.find('.AppointmentCard').toggleClass('in-edit', isEdit);

            if (this.viewModel.currentID() <= 0) {
                return;
            }
            
            var version;
            
            if (isEdit) {
                // Create and set a version to be edited
                version = new ModelVersion(this.viewModel.currentAppointment());
                this.viewModel.editedVersion(version);
                this.viewModel.editedAppointment(version.version);
                
                // Setup auto-saving
                var vw = this.viewModel;
                version.on('push', function(success) {
                    if (success) {
                        vw.isSaving(true);
                        app.model.appointments.setAppointment(version.version)
                        .then(function(savedApt) {
                            //var wasNew = version.original.id() < 1;
                            // Update with remote data, the original appointment in the version,
                            // not the currentAppointment or in the index in the list to avoid
                            // race-conditions
                            version.original.model.updateWith(savedApt);
                            
                            // TODO: wasNew:true: add to the list and sort it??
                            // There is a wizard for bookings, so may be different on that case
                        })
                        .catch(function(err) {
                            // Show error
                            app.modals.showError({
                                title: 'There was an error saving the data.',
                                error: err && err.error || err
                            });
                            // Don't replicate error, allow always
                        })
                        .then(function() {
                            // ALWAYS:
                            vw.isSaving(false);
                        });
                    }
                });
            }
            else {
                // There is a version? Push changes!
                version = this.viewModel.editedVersion();
                
                if (version && version.areDifferent()) {
                    // Push version to original, will launch a remote update 
                    // if anithing changed
                    // TODO: ask for confirmation if version isObsolete
                    version.push({ evenIfObsolete: true });
                }
            }

        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(options) {
    /* jshint maxcomplexity:10 */
    Activity.prototype.show.call(this, options);
    
    var s1 = options && options.route && options.route.segments[0],
        s2 = options && options.route && options.route.segments[1],
        date,
        id;

    if (/^\-?\d+$/.test(s1)) {
        // first parameter is an ID, use current date and try to load if possible
        date = new Date();
        id = s1 |0;
    }
    else {
        date = getDateWithoutTime(s1);
        id = s2 |0;
    }

    this.viewModel.currentID(id);
    this.viewModel.currentDate(date);
    
    // If the request includes an appointment plain object, that's an
    // in-editing appointment so put it in place (to restore a previous edition)
    if (this.requestData.appointment) {
        this.viewModel.editMode(true);
        this.viewModel.editedAppointment().model.updateWith(this.requestData.appointment);
    }
    else {
        // On any other case, and to prevent bad editMode on entering, 
        // do a discard taht sets editMode off
        this.viewModel.cancel();
    }

    // If there are options (may not be on startup or
    // on cancelled edition).
    /*if (options !== null) {

        var booking = this.viewModel.currentAppointment();
        // It comes back from the textEditor.
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
    }*/
};

var Appointment = require('../models/Appointment');

function getDateWithoutTime(date) {
    if (!date) {
        date = new Date();
    }
    else if (!(date instanceof Date)) {
        date = new Date(date);
    }

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0, 0, 0
    );
}

function findAppointmentInList(list, id) {
    var found = null,
        index = -1;
    list.some(function(apt, i) {
        if (apt.id() === id) {
            found = apt;
            index = i;
            return true;
        }
    });
    return {
        item: found,
        index: index
    };
}

var CalendarEvent = require('../models/CalendarEvent'),
    Booking = require('../models/Booking');

function ViewModel(app) {
    /*jshint maxstatements: 30 */

    this.appointments = ko.observableArray([]);
    this.currentDate = ko.observable(new Date());
    this.currentID = ko.observable(0);
    this.currentIndex = ko.observable(0);
    this.editMode = ko.observable(false);
    this.isLoading = ko.observable(false);
    this.isSaving = ko.observable(false);
    this.editedVersion = ko.observable(null);
    this.editedAppointment = ko.observable(new Appointment());

    var loadingAppointment = new Appointment({
        id: 0,
        summary: 'Loading...'
    });
    var newEmptyDateAppointment = function newEmptyDateAppointment() {
        return new Appointment({
            id: -1,
            summary: 'There are no appointments on this date',
            startTime: this.currentDate(),
            endTime: moment(this.currentDate()).add(1, 'days').toDate()
        });
    }.bind(this);
    var newFreeAppointment = function newFreeAppointment() {
        return new Appointment({
            id: -2,
            summary: 'Free',
            startTime: this.currentDate(),
            endTime: moment(this.currentDate()).add(1, 'days').toDate()
        });
    }.bind(this);
    var newEventAppointment = function newEventAppointment() {
        return new Appointment({
            id: -3,
            summary: 'New event...',
            sourceEvent: new CalendarEvent()
        });
    };
    var newBookingAppointment = function newBookingAppointment() {
        return new Appointment({
            id: -4,
            summary: 'New booking...',
            sourceEvent: new CalendarEvent(),
            sourceBooking: new Booking()
        });
    };

    this.isNew = ko.computed(function(){
        return this.currentID() === -3 || this.currentID() === -4;
    }, this);

    this.currentAppointment = ko.computed(function() {
        /*jshint maxcomplexity: 10*/

        var id = this.currentID(),
            // Important, used in the search but too required
            // to be a dependency when the list changes (to update
            // from the 'loadingAppointment'):
            apts = this.appointments();

        switch (id) {
            case -1:
                return newEmptyDateAppointment();
            case -2:
                return newFreeAppointment();
            case -3:
                this.editMode(true);
                return newEventAppointment();
            case -4:
                this.editMode(true);
                return newBookingAppointment();
            case -5:
                return loadingAppointment;
            default:
                // Positive ID: set a temporary/loading apt
                // and search for the ID
                if (id > 0) {
                    // Trigger inmediate search if not in loading
                    if (!this.isLoading()) {
                        // search in list and set index
                        var found = findAppointmentInList(apts, id);
                        this.currentIndex(found.index);
                        return found.item;
                    }
                    return loadingAppointment;
                }
                else {
                    // 0 or any other value:
                    // look first in list
                    if (this.appointments().length === 0) {
                        // empty date -> -1
                        setTimeout(function(){
                            this.currentID(-1);
                        }.bind(this), 0);
                        this.currentIndex(-1);
                        return newEmptyDateAppointment();
                    }
                    else {
                        setTimeout(function(){
                            this.currentID(this.appointments()[0].id());
                            this.currentIndex(0);
                        }.bind(this), 0);
                        // Waiting for load:
                        return loadingAppointment;
                    }
                }
        }
    }, this)
    // Avoiding multiple evaluations because of consecutive updates on the observables
    .extend({ rateLimit: 0 });

    this.goPrevious = function goPrevious() {
        if (this.editMode()) return;

        var index = this.currentIndex() - 1;

        if (index < 0) {
            // Go previous date
            // First change ID to be 'loading' to show state and 
            // allow for auto look-up on loading finish.
            this.currentID(-5);
            // Calculate previous date
            var m = moment(this.currentDate());
            if (m.isValid()) {
                this.currentDate(m.subtract(1, 'days').toDate());
            }
            else {
                // Error fallback to today
                this.currentDate(getDateWithoutTime());
            }
        }
        else {
            // Go previous item in the list, by changing currentID
            var apt = this.appointments()[index % this.appointments().length];
            this.currentID(apt.id());
        }
    };

    this.goNext = function goNext() {
        if (this.editMode()) return;
        var index = this.currentIndex() + 1;

        if (index >= this.appointments().length) {
            // Go next date
            // First change ID to be 'loading' to show state and 
            // allow for auto look-up on loading finish.
            this.currentID(-5);
            // Calculate next date
            var m = moment(this.currentDate());
            if (m.isValid()) {
                this.currentDate(m.add(1, 'days').toDate());
            }
            else {
                // Error fallback to today
                this.currentDate(getDateWithoutTime());
            }
        }
        else {
            // Go next item in the list, by changing currentID
            var apt = this.appointments()[index % this.appointments().length];
            this.currentID(apt.id());
        }
    };

    this.edit = function edit() {
        // A subscribed handler ensure to do the needed tasks
        this.editMode(true);
    }.bind(this);
    
    this.save = function save() {
        // A subscribed handler ensure to do the needed tasks
        this.editMode(false);
    }.bind(this);

    this.cancel = function cancel() {

        if (this.editedVersion()) {
            // Discard previous version
            this.editedVersion().pull({ evenIfNewer: true });
        }
        // Out of edit mode
        this.editMode(false);
    }.bind(this);

    /**
        External actions
    **/
    var editFieldOn = function editFieldOn(activity, data) {

        // Include appointment to recover state on return:
        data.appointment = this.currentAppointment().model.toPlainObject(true);

        app.shell.go(activity, data);
    };

    this.pickDateTime = function pickDateTime() {

        editFieldOn('datetimePicker', {
            selectedDatetime: null
        });
    };

    this.pickClient = function pickClient() {

        editFieldOn('clients', {
            selectClient: true,
            selectedClient: null
        });
    };

    this.pickService = function pickService() {

        editFieldOn('services', {
            selectServices: true,
            selectedServices: this.currentAppointment().services()
        });
    }.bind(this);

    this.changePrice = function changePrice() {
        // TODO
    };

    this.pickLocation = function pickLocation() {

        editFieldOn('locations', {
            selectLocation: true,
            selectedLocation: this.currentAppointment().location()
        });
    }.bind(this);

    var textFieldsHeaders = {
        preNotesToClient: 'Notes to client',
        postNotesToClient: 'Notes to client (afterwards)',
        preNotesToSelf: 'Notes to self',
        postNotesToSelf: 'Booking summary'
    };

    this.editTextField = function editTextField(field) {

        editFieldOn('textEditor', {
            request: 'textEditor',
            field: field,
            title: this.isNew() ? 'New booking' : 'Booking',
            header: textFieldsHeaders[field],
            text: this.currentAppointment()[field]()
        });
    }.bind(this);
}

},{"../components/Activity":44,"../components/DatePicker":45,"../models/Appointment":49,"../models/Booking":50,"../models/CalendarEvent":52,"../utils/ModelVersion":82,"knockout":false,"moment":false}],4:[function(require,module,exports){
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
    ko = require('knockout');
    //CalendarSlot = require('../models/CalendarSlot');

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
            this.viewModel.currentDate(getDateWithoutTime());

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
                this.viewModel.currentDate(getDateWithoutTime(e.date));
            }
        }.bind(this)
    });

    // Set date to today
    this.viewModel.currentDate(getDateWithoutTime());
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    // Date from the parameter, fallback to today
    var sdate = options.route && options.route.segments && options.route.segments[0],
        date;
    if (sdate) {
        // Parsing date from ISO format
        var mdate = moment(sdate);
        // Check is valid, and ensure is date at 12AM
        date = mdate.isValid() ? getDateWithoutTime(mdate.toDate()) : null;
    }
    
    if (!date)
        // Today:
        date = getDateWithoutTime();
    
    this.viewModel.currentDate(date);
};

function getDateWithoutTime(date) {
    date = date || new Date();
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0, 0, 0
    );
}

var Appointment = require('../models/Appointment'),
    TimeSlotViewModel = require('../viewmodels/TimeSlot');

function ViewModel(app) {

    this.currentDate = ko.observable(getDateWithoutTime());
    var fullDayFree = [Appointment.newFreeSlot({ date: this.currentDate() })];

    // slotsSource save the data as processed by a request of 
    // data because a date change.
    // It's updated by changes on currentDate that performs the remote loading
    this.slotsSource = ko.observable(fullDayFree);
    // slots computed, using slotsSource.
    // As computed in order to allow any other observable change
    // from trigger the creation of a new value
    this.slots = ko.computed(function() {
    
        var slots = this.slotsSource();
        
        return app.model.appointments
            .fillWithFreeSlots(slots)
            .map(TimeSlotViewModel.fromAppointment);

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
        
        app.model.appointments.getAppointmentsByDate(date)
        .then(function(appointmentsList) {
            
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
        
            if (appointmentsList && appointmentsList.length) {
                // Update the source:
                this.slotsSource(appointmentsList);
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

},{"../components/Activity":44,"../components/DatePicker":45,"../models/Appointment":49,"../viewmodels/TimeSlot":123,"knockout":false,"moment":false}],7:[function(require,module,exports){
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

},{"../components/Activity":44,"../models/Client":54,"knockout":false}],9:[function(require,module,exports){
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

},{"../components/Activity":44,"../testdata/clients":74,"knockout":false}],10:[function(require,module,exports){
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

},{"../components/Activity":44,"../testdata/clients":74,"knockout":false}],11:[function(require,module,exports){
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

},{"../components/Activity":44,"../models/MailFolder":60,"../testdata/messages":76,"knockout":false}],14:[function(require,module,exports){
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

},{"../components/Activity":44,"../components/DatePicker":45,"../testdata/timeSlots":78,"../utils/Time":85,"knockout":false,"moment":false}],15:[function(require,module,exports){
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

},{"../components/Activity":44,"../models/Model":63,"knockout":false}],16:[function(require,module,exports){
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
    appModel.bookings.getUpcomingBookings().then(function(upcoming) {

        if (upcoming.nextBookingID) {
            var previousID = v.nextBooking() && v.nextBooking().sourceBooking().bookingID();
            if (upcoming.nextBookingID !== previousID) {
                v.isLoadingNextBooking(true);
                appModel.appointments.getAppointment({ bookingID: upcoming.nextBookingID })
                .then(function(apt) {
                    v.nextBooking(apt);
                    v.isLoadingNextBooking(false);
                })
                .catch(function() {
                    v.isLoadingNextBooking(false);
                });
            }
        }
        else {
            v.nextBooking(null);
        }

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
    this.isLoadingNextBooking = ko.observable(false);
    
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

},{"../components/Activity":44,"../models/GetMore":55,"../models/MailFolder":60,"../models/PerformanceSummary":64,"../models/UpcomingBookingsSummary":71,"../testdata/messages":76,"knockout":false}],19:[function(require,module,exports){
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

},{"../components/Activity":44,"../models/MailFolder":60,"../testdata/messages":76,"knockout":false}],20:[function(require,module,exports){
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

var Activity = require('../components/Activity'),
    UserJobProfileViewModel = require('../viewmodels/UserJobProfile');

var A = Activity.extends(function JobtitlesActivity() {
    
    Activity.apply(this, arguments);
    
    this.accessLevel = this.app.UserType.LoggedUser;
    this.viewModel = new UserJobProfileViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Scheduling');
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    this.viewModel.sync();

    //// Set the job title
    //var jobID = state.route.segments[0] |0;
    //this.viewModel.jobTitleID(jobID);
};

},{"../components/Activity":44,"../viewmodels/UserJobProfile":124}],22:[function(require,module,exports){
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
},{"../components/Activity":44,"../models/Location":59,"knockout":false}],24:[function(require,module,exports){
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

},{"../components/Activity":44,"../testdata/locations":75,"knockout":false}],25:[function(require,module,exports){
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

},{"../components/Activity":44,"../viewmodels/FormCredentials":120,"knockout":false}],26:[function(require,module,exports){
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
},{"../components/Activity":44,"../models/Position":65,"knockout":false}],30:[function(require,module,exports){
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

var Activity = require('../components/Activity'),
    UserJobProfileViewModel = require('../viewmodels/UserJobProfile');

var A = Activity.extends(function SchedulingActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    this.viewModel = new UserJobProfileViewModel(this.app);
    this.navBar = Activity.createSectionNavBar('Scheduling');
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    this.viewModel.sync();
};

},{"../components/Activity":44,"../viewmodels/UserJobProfile":124}],33:[function(require,module,exports){
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
        console.log('jobTitleID', jobTitleID);
        this.app.model.userJobProfile.getUserJobTitle(jobTitleID).then(function(userJobtitle) {
            if (!userJobtitle) {
                console.log('No user job title');
                return;
            }
            // Fill in job title name
            this.app.model.getJobTitle(jobTitleID).then(function(jobTitle) {
                if (!jobTitle) {
                    console.log('No job title');
                    return;
                }
                this.navBar.leftAction().text(jobTitle.singularName());
            }.bind(this));
            
            // TODO Load job title pricing on this activity:
            //this.viewModel.services(userJobtitle.services());
            console.log('Job Title Pricing/Services load not supported still');
        }.bind(this));
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

},{"../components/Activity":44,"../testdata/services":77,"knockout":false}],35:[function(require,module,exports){
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

},{"../components/Activity":44,"../viewmodels/FormCredentials":120,"knockout":false}],36:[function(require,module,exports){
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

var ko = require('knockout'),
    propTools = require('./utils/jsPropertiesTools'),
    getObservable = require('./utils/getObservable');

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
    
    /// feedback-entry
    ko.components.register('app-time-slot-tile', {
        template: { element: 'time-slot-tile-template' },
        viewModel: require('./viewmodels/TimeSlot')
    });
};

},{"./utils/getObservable":92,"./utils/jsPropertiesTools":95,"./viewmodels/TimeSlot":123,"knockout":false}],39:[function(require,module,exports){
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

},{"./viewmodels/NavAction":121,"./viewmodels/NavBar":122,"knockout":false}],40:[function(require,module,exports){
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

},{"./app-components":38,"./app-navbar":39,"./app.activities":40,"./app.modals":42,"./app.shell":43,"./components/SmartNavBar":46,"./locales/en-US-LC":47,"./utils/Function.prototype._delayed":80,"./utils/Function.prototype._inherits":81,"./utils/accessControl":86,"./utils/bootknockBindingHelpers":88,"./utils/bootstrapSwitchBinding":89,"./utils/jquery.multiline":94,"./viewmodels/AppModel":113,"es6-promise":false,"knockout":false}],42:[function(require,module,exports){
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

},{"./utils/shell/hashbangHistory":100,"./utils/shell/index":101}],44:[function(require,module,exports){
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

},{"../utils/Function.prototype._inherits":81,"../viewmodels/NavAction":121,"../viewmodels/NavBar":122,"knockout":false}],45:[function(require,module,exports){
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

},{"./Model":63,"knockout":false}],49:[function(require,module,exports){
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
        // An appointment ever references an event, and its 'id' is a CalendarEventID
        // even if other complementary object are used as 'source'
        id: null,
        
        startTime: null,
        endTime: null,
        
        // Event summary:
        summary: 'New booking',
        description: null,
        
        subtotalPrice: 0,
        feePrice: 0,
        pfeePrice: 0,
        totalPrice: 0,
        ptotalPrice: 0,
        
        preNotesToClient: null,
        postNotesToClient: null,
        preNotesToSelf: null,
        postNotesToSelf: null,
        
        sourceEvent: null,
        sourceBooking: null
        //sourceBookingRequest, maybe future?
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

/**
    Creates an appointment instance from a CalendarEvent model instance
**/
Appointment.fromCalendarEvent = function fromCalendarEvent(event) {
    var apt = new Appointment();
    
    // Include event in apt
    apt.id(event.calendarEventID());
    apt.startTime(event.startTime());
    apt.endTime(event.endTime());
    apt.summary(event.summary());
    apt.sourceEvent(event);
    
    return apt;
};

/**
    Creates an appointment instance from a Booking and a CalendarEvent model instances
**/
Appointment.fromBooking = function fromBooking(booking, event) {
    // Include event in apt
    var apt = Appointment.fromCalendarEvent(event);
    
    // Include booking in apt
    // TODO Needs review, maybe after redone appointment:
    var prices = booking.bookingRequest() && booking.bookingRequest().pricingEstimate();
    if (prices) {
        apt.subtotalPrice(prices.subtotalPrice());
        apt.feePrice(prices.feePrice());
        apt.pfeePrice(prices.pFeePrice());
        apt.totalPrice(prices.totalPrice());
        apt.ptotalPrice(prices.totalPrice() - prices.pFeePrice());
    }
    apt.sourceBooking(booking);
    
    return apt;
};

/**
    Creates a list of appointment instances from the list of events and bookings.
    The bookings list must contain every booking that belongs to the events of type
    'booking' from the list of events.
**/
Appointment.listFromCalendarEventsBookings = function listFromCalendarEventsBookings(events, bookings) {
    return events.map(function(event) {
        var booking = null;
        bookings.some(function(searchBooking) {
            var found = searchBooking.confirmedDateID() === event.calendarEventID();
            if (found) {
                booking = searchBooking;
                return true;
            }
        });

        if (booking)
            return Appointment.fromBooking(booking, event);
        else
            return Appointment.fromCalendarEvent(event);
    });
};

var Time = require('../utils/Time');
/**
    Creates an Appointment instance that represents a calendar slot of
    free/spare time, for the given time range, or the full given date.
    @param options:Object {
        date:Date. Optional. Used to create a full date slot or default for start/end
            to date start or date end
        start:Date. Optional. Beggining of the slot
        end:Date. Optional. Ending of the slot
        text:string. Optional ['Free']. To allow external localization of the text.
    }
**/
Appointment.newFreeSlot = function newFreeSlot(options) {
    
    var start = options.start || new Time(options.date, 0, 0, 0),
        end = options.end || new Time(options.date, 0, 0, 0);

    return new Appointment({
        id: -2,

        startTime: start,
        endTime: end,

        summary: options.text || 'Free',
        description: null
    });
};

},{"../utils/Time":85,"./Client":54,"./Location":59,"./Model":63,"./Service":69,"knockout":false,"moment":false}],50:[function(require,module,exports){
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
    
    this.bookingRequest(new BookingRequest(values && values.bookingRequest || {}));
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
    
    this.pricingEstimate(new PricingEstimate(values && values.pricingEstimate || {}));
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
    
    if (values && Array.isArray(values.details)) {
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

},{"./Model":63}],51:[function(require,module,exports){
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

},{"./Model":63,"knockout":false,"moment":false}],52:[function(require,module,exports){
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
},{"./Model":63,"knockout":false}],53:[function(require,module,exports){
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

},{"./Model":63}],54:[function(require,module,exports){
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

},{"./Model":63,"knockout":false}],55:[function(require,module,exports){
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

},{"./ListViewItem":58,"./Model":63,"knockout":false}],56:[function(require,module,exports){
/** JobTitle model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    JobTitlePricingType = require('./JobTitlePricingType');

function JobTitle(values) {
    
    Model(this);
    
    this.model.defProperties({
        jobTitleID: 0,
        singularName: '',
        pluralName: '',
        aliases: '',
        description: null,
        searchDescription: null,
        createdDate: null,
        updatedDate: null
    }, values);

    this.model.defID(['jobTitleID']);

    // Pricing Types relationship,
    // collection of JobTitlePricingType entities
    this.pricingTypes = ko.observableArray([]);
    if (values && values.pricingTypes) {
        values.pricingTypes.forEach(function(jobpricing) {
            this.pricingTypes.push(new JobTitlePricingType(jobpricing));
        }.bind(this));
    }
}

module.exports = JobTitle;

},{"./JobTitlePricingType":57,"./Model":63,"knockout":false}],57:[function(require,module,exports){
/**
    Defines the relationship between a JobTitle and a PricingType.
**/
'use strict';

var Model = require('./Model');

function JobTitlePricingType(values) {

    Model(this);
    
    this.model.defProperties({
        pricingTypeID: 0,
        // NOTE: Client Type is mostly unused today but exists
        // on all database records. It uses the default value
        // of 1 all the time for now.
        clientTypeID: 1,
        createdDate: null,
        updatedDate: null
    }, values);
    
    this.model.defID(['pricingTypeID', 'clientTypeID']);
}

module.exports = JobTitlePricingType;

},{"./Model":63}],58:[function(require,module,exports){
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

},{"./Model":63}],59:[function(require,module,exports){
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

},{"./Model":63,"knockout":false}],60:[function(require,module,exports){
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

},{"./Model":63,"knockout":false,"lodash":false}],61:[function(require,module,exports){
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

},{"./Model":63}],62:[function(require,module,exports){
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

},{"./Model":63,"knockout":false,"moment":false}],63:[function(require,module,exports){
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

},{"knockout":false,"knockout.mapping":false}],64:[function(require,module,exports){
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

},{"./ListViewItem":58,"./Model":63,"knockout":false,"moment":false,"numeral":1}],65:[function(require,module,exports){
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

},{"./Model":63}],66:[function(require,module,exports){
/**
    Pricing Type model
**/
'use strict';

var Model = require('./Model');

function PricingType(values) {
    
    Model(this);
    
    this.model.defProperties({
        pricingTypeID: 0,
        singularName: '',
        pluralName: '',
        slugName: '',
        addNewLabel: null,
        freelancerDescription: null,
        // PriceCalculationType enumeration value:
        priceCalculation: null,
        isAddon: false,
        
        // Form Texts
        namePlaceHolder: null,
        suggestedName: null,
        fixedName: null,
        durationLabel: null,
        priceLabel: null,
        priceNote: null,
        firstTimeClientsOnlyLabel: null,
        descriptionPlaceHolder: null,
        priceRateQuantityLabel: null,
        priceRateUnitLabel: null,
        noPriceRateLabel: null,
        numberOfSessionsLabel: null,
        inPersonPhoneLabel: null,
        
        // Action And Validation Texts
        successOnDelete: null,
        errorOnDelete: null,
        successOnSave: null,
        errorOnSave: null,
        priceRateIsRequiredValidationError: null,
        priceRateUnitIsRequiredValidationError: null,
        
        // Help Texts
        learnMoreLabel: null,
        learnMoreText: null,
        priceRateLearnMoreLabel: null,
        priceRateLearnMoreText: null,
        noPriceRateLearnMoreLabel: null,
        noPriceRateLearnMoreText: null,
        
        // Additional configuration
        requireDuration: false,
        includeServiceAttributes: false,
        includeSpecialPromotion: false,
        
        // List Texts
        /// SummaryFormat is the default format for summaries (required),
        /// other formats are good for better detail, but depends
        /// on other options configured per type.
        /// Wildcards:
        /// {0}: duration
        /// {1}: sessions
        /// {2}: inperson/phone
        summaryFormat: null,
        summaryFormatMultipleSessions: null,
        summaryFormatNoDuration: null,
        summaryFormatMultipleSessionsNoDuration: null,
        withoutServiceAttributesCustomerMessage: null,
        withoutServiceAttributesFreelancerMessage: null,
        firstTimeClientsOnlyListText: null,
        priceRateQuantityListLabel: null,
        priceRateUnitListLabel: null,
        noPriceRateListMessage: null,
        
        // Booking/PricingEstimate Texts
        /// NameAndSummaryFormat is the default format for summaries with package name (required),
        /// other formats are good for better detail, but depends
        /// on other options configured per type.
        /// Wildcards:
        /// {0}: package name
        /// {1}: duration
        /// {2}: sessions
        /// {3}: inperson/phone
        nameAndSummaryFormat: null,
        nameAndSummaryFormatMultipleSessions: null,
        nameAndSummaryFormatNoDuration: null,
        nameAndSummaryFormatMultipleSessionsNoDuration: null,
        
        // Record maintenance
        createdDate: null,
        updatedDate: null
    }, values);
    
    this.model.defID(['pricingTypeID']);
}

module.exports = PricingType;

// Enumeration:
var PriceCalculationType = {
    FixedPrice: 1,
    HourlyPrice: 2
};

PricingType.PriceCalculationType = PriceCalculationType;

},{"./Model":63}],67:[function(require,module,exports){
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

},{"./Model":63}],68:[function(require,module,exports){
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

},{"./Model":63}],69:[function(require,module,exports){
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

},{"./Model":63,"knockout":false}],70:[function(require,module,exports){
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
},{"./Model":63,"knockout":false,"moment":false}],71:[function(require,module,exports){
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

},{"./BookingSummary":51,"./Model":63,"knockout":false}],72:[function(require,module,exports){
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

},{"./Model":63,"knockout":false}],73:[function(require,module,exports){
/**
    UserJobTitle model, relationship between an user and a
    job title and the main data attached to that relation.
**/
'use strict';

var Model = require('./Model');

function UserJobTitle(values) {
    
    Model(this);
    
    this.model.defProperties({
        userID: 0,
        jobTitleID: 0,
        intro: null,
        statusID: 0,
        cancellationPolicyID: 0,
        instantBooking: false,
        createdDate: null,
        updatedDate: null
    }, values);
    
    this.model.defID(['userID', 'jobTitleID']);
}

module.exports = UserJobTitle;

},{"./Model":63}],74:[function(require,module,exports){
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

},{"../models/Client":54}],75:[function(require,module,exports){
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

},{"../models/Location":59}],76:[function(require,module,exports){
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

},{"../models/Message":62,"../utils/Time":85}],77:[function(require,module,exports){
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

},{"../models/Service":69}],78:[function(require,module,exports){
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

},{"../utils/Time":85,"moment":false}],79:[function(require,module,exports){
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

},{"moment":false}],80:[function(require,module,exports){
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

},{}],81:[function(require,module,exports){
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

},{}],82:[function(require,module,exports){
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

},{"events":false,"knockout":false}],83:[function(require,module,exports){
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

},{"../utils/CacheControl":79,"../utils/ModelVersion":82,"events":false,"knockout":false,"localforage":false}],84:[function(require,module,exports){
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

},{}],85:[function(require,module,exports){
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

},{}],86:[function(require,module,exports){
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

},{}],87:[function(require,module,exports){
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
},{}],88:[function(require,module,exports){
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

},{}],89:[function(require,module,exports){
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

},{}],90:[function(require,module,exports){
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

},{}],91:[function(require,module,exports){
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

},{}],92:[function(require,module,exports){
/**
    Get a given value wrapped in an observable or returns
    it if its already an observable or just a function.
**/
'use strict';
var ko = require('knockout');

module.exports = function getObservable(obsOrValue) {
    if (typeof(obsOrValue) === 'function')
        return obsOrValue;
    else
        return ko.observable(obsOrValue);
};

},{"knockout":false}],93:[function(require,module,exports){
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

},{}],94:[function(require,module,exports){
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

},{}],95:[function(require,module,exports){
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

},{}],96:[function(require,module,exports){
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

},{"../escapeSelector":91}],97:[function(require,module,exports){
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

},{"./dependencies":99}],98:[function(require,module,exports){
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

},{"../escapeRegExp":90,"./sanitizeUrl":104}],99:[function(require,module,exports){
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

},{}],100:[function(require,module,exports){
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

},{"../getUrlQuery":93,"./sanitizeUrl":104}],101:[function(require,module,exports){
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

},{"./DomItemsManager":96,"./Shell":97,"./absolutizeUrl":98,"./dependencies":99,"./loader":102,"./parseUrl":103,"events":false}],102:[function(require,module,exports){
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

},{}],103:[function(require,module,exports){
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
},{"../escapeRegExp":90,"../getUrlQuery":93}],104:[function(require,module,exports){
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
},{}],105:[function(require,module,exports){
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

},{"localforage":false}],106:[function(require,module,exports){
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
},{"../models/CalendarEvent":52,"../utils/apiHelper":87}],107:[function(require,module,exports){
/**
    Appointments is an abstraction around calendar events
    that behave as bookings or as events (where bookings are built
    on top of an event instance --a booking record must have ever a confirmedDateID event).
    
    With this appModel, the APIs to manage events&bookings are combined to offer related
    records easier in Appointments objects.
**/
'use strict';

var Appointment = require('../models/Appointment'),
    moment = require('moment');

exports.create = function create(appModel) {

    var api = {};
    
    var cache = {
        aptsByDate: {}
    };

    /**
        Get a generic calendar appointment object, made of events and/or bookings,
        depending on the given ID in the ids object.
        
        TODO: Implement cache for the Appointment Models (the back-end models for
        bookings and events is already managed by its own API).
    **/
    api.getAppointment = function getAppointment(ids) {

        if (ids.calendarEventID) {
            return appModel.calendarEvents.getEvent(ids.calendarEventID)
            .then(Appointment.fromCalendarEvent);
        }
        else if (ids.bookingID) {
            return appModel.bookings.getBooking(ids.bookingID)
            .then(function(booking) {
                // An appointment for booking needs the confirmed event information
                return appModel.calendarEvents.getEvent(booking.confirmedDateID())
                .then(function(event) {
                    return Appointment.fromBooking(booking, event);
                });
            });
        }
        else {
            return Promise.reject('Unrecognized ID');
        }
    };
    
    /**
        Get a list of generic calendar appointment objects, made of events and/or bookings
        by Date.
        It's cached.
    **/
    api.getAppointmentsByDate = function getAppointmentsByDate(date) {
        var dateKey = moment(date).format('YYYYMMDD');
        if (cache.aptsByDate.hasOwnProperty(dateKey)) {
            
            return Promise.resolve(cache.aptsByDate[dateKey].data);

            // TODO lazy load, on background, for synchronization, depending on cache control
        }
        else {
            // TODO check localforage copy first?

            // Remote loading data
            return Promise.all([
                appModel.bookings.getBookingsByDate(date),
                appModel.calendarEvents.getEventsByDate(date)
            ]).then(function(group) {

                var events = group[1],
                    bookings = group[0],
                    apts = [];

                if (events && events().length) {
                    apts = Appointment.listFromCalendarEventsBookings(events(), bookings());
                }
                
                // TODO localforage copy of [dateKey]=bookings
                
                // Put in cache
                cache.aptsByDate[dateKey] = { data: apts };
                // Return the array
                return apts;
            });
        }
    };
    
    /**
        Introduce free slots wherever needed in the given
        array of Appointments, to fill any gap in a natural day
        (from Midnight to Midnight next date).
        A new array is returned, but the original gets sorted 
        by startTime.
    **/
    api.fillWithFreeSlots = function fillWithFreeSlots(appointmentsList) {

        // First, ensure list is sorted
        var slots = appointmentsList.sort(function(a, b) {
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
                filledSlots.push(Appointment.newFreeSlot({
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

            filledSlots.push(Appointment.newFreeSlot({
                start: lastDateTime,
                end: nextMidnight
            }));
        }

        return filledSlots;
    };
    
    return api;
};

},{"../models/Appointment":49,"moment":false}],108:[function(require,module,exports){
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
    
    /**
        Get upcoming bookings meta-information for dashboard page
        TODO: implement cache??
    **/
    api.getUpcomingBookings = function getUpcomingBookings() {
        return appModel.rest.get('upcoming-bookings');
    };

    /**
        Get a specific booking by ID
        TODO: Implement cache? reusing cacheByDate?
    **/
    api.getBooking = function getBooking(id) {
        if (!id) return Promise.reject('The bookingID is required to get a booking');
        return appModel.rest.get('bookings/' + id)
        .then(function(booking) {
            return new Booking(booking);
        });
    };
    
    return api;
};

},{"../models/Booking":50,"knockout":false,"moment":false}],109:[function(require,module,exports){
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
    
    var cache = {
        eventsByDate: {}
    };

    /*apiHelper.defineCrudApiForRest({
        extendedObject: api.remote,
        Model: CalendarEvent,
        modelName: 'CalendarEvent',
        modelListName: 'CalendarEvents',
        modelUrl: 'events',
        idPropertyName: 'calendarEventID'
    });*/

    api.getEventsByDate = function getEventsByDate(date) {
        var dateKey = moment(date).format('YYYYMMDD');
        if (cache.eventsByDate.hasOwnProperty(dateKey)) {
            
            return Promise.resolve(cache.eventsByDate[dateKey].data);

            // TODO lazy load, on background, for synchronization, based on cache control
        }
        else {
            // TODO check localforage copy first?

            // Remote loading data
            return api.remote.getCalendarEvents({
                start: date,
                end: moment(date).add(1, 'days').toDate()
            }).then(function(events) {
                // TODO localforage copy of [dateKey]=bookings

                // Put in cache (they are already model instances)
                var arr = ko.observableArray(events);
                cache.eventsByDate[dateKey] = { data: arr };
                // Return the observable array
                // TODO Review really if has sense to have an observable array, take care of its use (on appointments mainly)
                return arr;
            });
        }
    };
    
    /**
        Get a specific event by ID
        TODO: Implement cache. Reusing cacheByDate, re-index?
    **/
    api.getEvent = function getEvent(id) {
        if (!id) return Promise.reject('The calendarEventID is required to get an event');

        return appModel.rest.get('events/' + id)
        .then(function(event) {
            return new CalendarEvent(event);
        });
    };

    return api;
};

},{"../models/CalendarEvent":52,"knockout":false,"moment":false}],110:[function(require,module,exports){
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

},{"../models/CalendarSyncing":53,"../utils/RemoteModel":83,"knockout":false}],111:[function(require,module,exports){
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

},{"../models/Address":48,"../utils/RemoteModel":83}],112:[function(require,module,exports){
/** Fetch Job Titles and Pricing Types information
**/
'use strict';

var localforage = require('localforage'),
    PricingType = require('../models/PricingType'),
    JobTitle = require('../models/JobTitle');

exports.create = function create(appModel) {

    var api = {},
        cache = {
            jobTitles: {},
            pricingTypes: null
        };
    
    /**
        Convert raw array of pricing types records into
        an indexed array of models, actually an object
        with ID numbers as properties,
        and cache it in memory.
    **/
    function mapToPricingTypes(rawItems) {
        cache.pricingTypes = {};
        
        if (rawItems) {
            rawItems.forEach(function(rawItem) {
                cache.pricingTypes[rawItem.pricingTypeID] = new PricingType(rawItem);
            });
        }

        return cache.pricingTypes;
    }

    /**
        Public API
        Returns a promise to fetch pricing types information
    **/
    api.getPricingTypes = function getPricingTypes() {
        // First, in-memory cache
        if (cache.pricingTypes) {
            return Promise.resolve(cache.pricingTypes);
        }
        else {
            // Second, local storage
            return localforage.getItem('pricingTypes')
            .then(function(pricingTypes) {
                if (pricingTypes) {
                    return mapToPricingTypes(pricingTypes);
                }
                else {
                    // Third and last, remote loading
                    return appModel.rest.get('pricing-types')
                    .then(function (raw) {
                        // Cache in local storage
                        localforage.setItem('pricingTypes', raw);
                        return mapToPricingTypes(raw);
                    });
                }
            });
        }
    };

    /**
        Public API
        Returns a promise to fetch a pricing type by ID
    **/
    api.getPricingType = function getPricingType(id) {
        // The REST API allows to fetch a single pricing type by ID,
        // if we have that not cached. But since load all is quick (they are a few
        // and will stay being a short list), we can ask for all and get from that.
        // So is enough reusing the general 'get all' API and more simple code.
        // NOTE: The single item API will still be useful for future sync updates.
        return api.getPricingTypes().then(function(allByID) {
            return allByID[id] || null;
        });
    };

    /**
        Public API
        Get a Job Title information by ID
    **/
    api.getJobTitle = function getJobTitle(id) {
        if (!id) return Promise.reject('Needs an ID to get a Job Title');

        // First, in-memory cache
        if (cache.jobTitles[id]) {
            return Promise.resolve(cache.jobTitles[id]);
        }
        else {
            // Second, local storage
            return localforage.getItem('jobTitles/' + id)
            .then(function(jobTitle) {
                if (jobTitle) {
                    // cache in memory as Model instance
                    cache.jobTitles[id] = new JobTitle(jobTitle);
                    // return it
                    return cache.jobTitles[id];
                }
                else {
                    // Third and last, remote loading
                    return appModel.rest.get('job-titles/' + id)
                    .then(function (raw) {
                        // Cache in local storage
                        localforage.setItem('jobTitles/' + id, raw);
                        // cache in memory as Model instance
                        cache.jobTitles[id] = new JobTitle(raw);
                        // return it
                        return cache.jobTitles[id];
                    });
                }
            });
        }
    };

    return api;
};

},{"../models/JobTitle":56,"../models/PricingType":66,"localforage":false}],113:[function(require,module,exports){
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
    this.jobTitles = require('./AppModel.jobTitles').create(this);
    this.userJobProfile = require('./AppModel.userJobProfile').create(this);
    this.appointments = require('./AppModel.appointments').create(this);
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

module.exports = AppModel;

// Class splited in different files to mitigate size and organization
// but keeping access to the common set of methods and objects easy with
// the same class.
// Loading extensions:
require('./AppModel-events').plugIn(AppModel);


},{"../models/Model":63,"../utils/Rest":84,"./AppModel-account":105,"./AppModel-events":106,"./AppModel.appointments":107,"./AppModel.bookings":108,"./AppModel.calendarEvents":109,"./AppModel.calendarSyncing":110,"./AppModel.homeAddress":111,"./AppModel.jobTitles":112,"./AppModel.marketplaceProfile":114,"./AppModel.privacySettings":115,"./AppModel.schedulingPreferences":116,"./AppModel.simplifiedWeeklySchedule":117,"./AppModel.userJobProfile":118,"./AppModel.userProfile":119,"knockout":false,"localforage":false}],114:[function(require,module,exports){
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

},{"../models/MarketplaceProfile":61,"../utils/RemoteModel":83}],115:[function(require,module,exports){
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

},{"../models/PrivacySettings":67,"../utils/RemoteModel":83}],116:[function(require,module,exports){
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

},{"../models/SchedulingPreferences":68,"../utils/RemoteModel":83}],117:[function(require,module,exports){
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

},{"../models/SimplifiedWeeklySchedule":70,"../utils/RemoteModel":83,"moment":false}],118:[function(require,module,exports){
/**
    Model API to manage the collection of Job Titles assigned
    to the current user and its working data.
**/
'use strict';

var UserJobTitle = require('../models/UserJobTitle'),
    CacheControl = require('../utils/CacheControl'),
    localforage = require('localforage');

exports.create = function create(appModel) {

    var api = {},
        defaultTtl = { minutes: 1 },
        cache = {
            // Array of user job titles making
            // its profile
            userJobProfile: {
                cache: new CacheControl({ ttl: defaultTtl }),
                list: null
            },
            // Indexed list by jobTitleID to the user job titles models
            // in the list and cache information
            userJobTitles: {}
        };
    
    /**
        Convert raw array of pricing types records into
        an indexed array of models, actually an object
        with ID numbers as properties,
        and cache it in memory.
    **/
    function mapToUserJobProfile(rawItems) {
        cache.userJobProfile.list = [];
        cache.userJobTitles = {};

        if (rawItems) {
            rawItems.forEach(function(rawItem) {
                var m = new UserJobTitle(rawItem);
                cache.userJobProfile.list.push(m);
                // Saving and indexed copy and per item cache info
                setGetUserJobTitleToCache(rawItem);
            });
        }

        // Update cache state
        cache.userJobProfile.cache.latest = new Date();
        
        return cache.userJobProfile.list;
    }
    
    /**
        Get the full jobProfile from local copy, throwing a Promise reject exception if nothing
    **/
    function getUserJobProfileFromLocal() {
        return localforage.getItem('userJobProfile')
        .then(function(userJobProfile) {
            if (userJobProfile) {
                return mapToUserJobProfile(userJobProfile);
            }
            // Throw error, so use catch to detect it
            throw { name: 'NotFoundLocal', message: 'Not found on local storage' };
        });
    }
    
    /**
        Set a raw userJobProfile record (from server) and set it in the
        cache, creating or updating the model (so all the time the same model instance
        is used) and cache control information.
        Returns the model instance.
    **/
    function setGetUserJobTitleToCache(rawItem) {
        var c = cache.userJobTitles[rawItem.jobTitleID] || {};
        // Update the model if exists, so get reflected to anyone consuming it
        if (c.model) {
            c.model.model.updateWith(rawItem);
        }
        else {
            // First time, create model
            c.model = new UserJobTitle(rawItem);
        }
        // Update cache control
        if (c.cache) {
            c.cache.latest = new Date();
        }
        else {
            c.cache = new CacheControl({ ttl: defaultTtl });
        }
        
        // Return the model, updated or just created
        return c.model;
    }
    
    /**
        Get the content from the cache, for full profile
        and save it in local storage
    **/
    function saveCacheInLocal() {
        var plain = cache.userJobProfile.list.map(function(item) {
            // Each item is a model, get it in plain:
            return item.model.toPlainObject();
        });
        localforage.setItem('userJobProfile', plain);
    }
    
    // Private, fetch from remote
    var fetchUserJobProfile = function () {
        // Third and last, remote loading
        return appModel.rest.get('user-job-profile')
        .then(function (raw) {
            // Cache in local storage
            localforage.setItem('userJobProfile', raw);
            return mapToUserJobProfile(raw);
        });
    };
    
    /**
        Public API
        Get the complete list of UserJobTitle for
        all the JobTitles assigned to the current user
    **/
    api.getUserJobProfile = function () {
        // If no cache or must revalidate, go remote
        if (cache.userJobProfile.cache.mustRevalidate()) {
            return fetchUserJobProfile();
        }
        else {
            // First, try cache
            if (cache.userJobProfile.list)
                return Promise.resolve(cache.userJobProfile.list);
            else
                // Second, local storage
                return getUserJobProfileFromLocal()
                // Fallback to remote if not found in local
                .catch(fetchUserJobProfile);
        }
    };
    
    // Private, fetch from remote
    var fetchUserJobTitle = function(jobTitleID) {
        return appModel.rest.get('user-job-profile/' + jobTitleID)
        .then(function(raw) {
            // Save to cache and get model
            var m = setGetUserJobTitleToCache(raw);
            // Save in local
            saveCacheInLocal();
            // Return model
            return m;
        });
    };
    
    /**
        Public API
        Get a UserJobTitle record for the given
        JobTitleID and the current user.
    **/
    api.getUserJobTitle = function (jobTitleID) {
        // Quick error
        if (!jobTitleID) return Promise.reject('Job Title ID required');
        
        // If no cache or must revalidate, go remote
        if (!cache.userJobTitles[jobTitleID] ||
            cache.userJobTitles[jobTitleID].cache.mustRevalidate()) {
            return fetchUserJobTitle(jobTitleID);
        }
        else {
            // First, try cache
            if (cache.userJobTitles[jobTitleID] &&
                cache.userJobTitles[jobTitleID].model) {
                return Promise.resolve(cache.userJobTitles[jobTitleID].model);
            }
            else {
                // Second, local storage, where we have the full job profile
                return getUserJobProfileFromLocal()
                .then(function(/*userJobProfile*/) {
                    // Not need for the parameter, the data is
                    // in memory and indexed, look for the job title
                    return cache.userJobTitles[jobTitleID].model;
                })
                // If no local copy (error on promise),
                // or that does not contains the job title (error on 'then'):
                // Third and last, remote loading
                .catch(fetchUserJobTitle.bind(null, jobTitleID));
            }
        }
    };
    
    return api;
};

},{"../models/UserJobTitle":73,"../utils/CacheControl":79,"localforage":false}],119:[function(require,module,exports){
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

},{"../models/User":72,"../utils/RemoteModel":83}],120:[function(require,module,exports){
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

},{"knockout":false}],121:[function(require,module,exports){
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

},{"../models/Model":63}],122:[function(require,module,exports){
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

},{"../models/Model":63}],123:[function(require,module,exports){
/**
    TimeSlot view model (aka: CalendarSlot) for use
    as part of the template/component time-slot-tile or activities
    providing data for the template.
**/
'use strict';

var getObservable = require('../utils/getObservable');

function TimeSlotViewModel(params) {
    /*jshint maxcomplexity:9*/

    this.startTime = getObservable(params.startTime || null);
    this.endTime = getObservable(params.endTime || null);
    this.subject = getObservable(params.subject || null);
    this.description = getObservable(params.description || null);
    this.link = getObservable(params.link || null);
    this.actionIcon = getObservable(params.actionIcon || null);
    this.actionText = getObservable(params.actionText || null);
    this.classNames = getObservable(params.classNames || null);
}

module.exports = TimeSlotViewModel;

var numeral = require('numeral');

/**
    Static constructor to convert an Appointment model into 
    a TimeSlot instance following UI criteria for preset values/setup.
**/
TimeSlotViewModel.fromAppointment = function fromAppointment(apt) {
    /*jshint maxcomplexity:8 */
    return new TimeSlotViewModel({
        startTime: apt.startTime,
        endTime: apt.endTime,
        subject: apt.summary,
        description: apt.description,
        link: '#!appointment/' + apt.startTime().toISOString() + '/' + apt.id(),
        actionIcon: (apt.sourceBooking() ? null : apt.sourceEvent() ? 'glyphicon glyphicon-chevron-right' : !apt.id() ? 'glyphicon glyphicon-plus' : null),
        actionText: (
            apt.sourceBooking() && 
            apt.sourceBooking().bookingRequest() && 
            apt.sourceBooking().bookingRequest().pricingEstimate() ? 
            numeral(apt.sourceBooking().bookingRequest().pricingEstimate().totalPrice() || 0).format('$0.00') :
            null
        ),
        classNames: (apt.id() ? null : 'ListView-item--tag-success')
    });
};

},{"../utils/getObservable":92,"numeral":1}],124:[function(require,module,exports){
/**
    UserJobProfileViewModel: loads data and keep state
    to display the listing of job titles from the 
    user job profile.
**/
'use strict';

var ko = require('knockout');

function UserJobProfileViewModel(app) {
    
    this.userJobProfile = ko.observableArray([]);

    this.isFirstTime = ko.observable(true);
    this.isLoading = ko.observable(false);
    this.isSyncing = ko.observable(false);
    this.thereIsError = ko.observable(false);
    
    // Load and save job title info
    var jobTitlesIndex = {};
    function syncJobTitle(jobTitleID) {
        return app.model.jobTitles.getJobTitle(jobTitleID)
        .then(function(jobTitle) {
            jobTitlesIndex[jobTitleID] = jobTitle;

            // TODO: errors? not-found job title?
        });
    }
    // Creates a 'jobTitle' observable on the userJobTitle
    // model to have access to a cached jobTitle model.
    function attachJobTitle(userJobTitle) {
        userJobTitle.jobTitle = ko.computed(function(){
            return jobTitlesIndex[this.jobTitleID()];
        }, userJobTitle);
    }
    
    var showLoadingError = function showLoadingError(err) {
        app.modals.showError({
            title: 'An error happening when loading your job profile.',
            error: err && err.error || err
        });
        
        this.isLoading(false);
        this.isSyncing(false);
        this.thereIsError(true);
    }.bind(this);

    // Loading and sync of data
    this.sync = function sync() {
        var firstTime = this.isFirstTime();
        this.isFirstTime(false);

        if (firstTime) {
            this.isLoading(true);
        }
        else {
            this.isSyncing(true);
        }

        // Keep data updated:
        app.model.userJobProfile.getUserJobProfile()
        .then(function(userJobProfile) {
            
            // We need the job titles info before end
            Promise.all(userJobProfile.map(function(userJobTitle) {
                return syncJobTitle(userJobTitle.jobTitleID());
            }))
            .then(function() {

                // Create jobTitle property before update
                // observable with the profile
                userJobProfile.forEach(attachJobTitle);
                
                this.userJobProfile(userJobProfile);

                this.isLoading(false);
                this.isSyncing(false);
                this.thereIsError(false);
            }.bind(this))
            .catch(showLoadingError);
        }.bind(this))
        .catch(showLoadingError);

    }.bind(this);
}

module.exports = UserJobProfileViewModel;

},{"knockout":false}]},{},[41])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvbm9kZV9tb2R1bGVzL251bWVyYWwvbnVtZXJhbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYWNjb3VudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYXBwb2ludG1lbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2Jvb2tNZUJ1dHRvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYm9va2luZ0NvbmZpcm1hdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY2FsZW5kYXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2NhbGVuZGFyU3luY2luZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY2xpZW50RWRpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY2xpZW50cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY21zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9jb250YWN0Rm9ybS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY29udGFjdEluZm8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2NvbnZlcnNhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvZGF0ZXRpbWVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2ZhcXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2ZlZWRiYWNrLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9mZWVkYmFja0Zvcm0uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2hvbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2luYm94LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9pbmRleC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvam9idGl0bGVzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9sZWFybk1vcmUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2xvY2F0aW9uRWRpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvbG9jYXRpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9sb2dpbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvbG9nb3V0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9vbmJvYXJkaW5nQ29tcGxldGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL29uYm9hcmRpbmdIb21lLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9vbmJvYXJkaW5nUG9zaXRpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9vd25lckluZm8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL3ByaXZhY3lTZXR0aW5ncy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvc2NoZWR1bGluZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvc2NoZWR1bGluZ1ByZWZlcmVuY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9zZXJ2aWNlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvc2lnbnVwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy90ZXh0RWRpdG9yLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy93ZWVrbHlTY2hlZHVsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FwcC1jb21wb25lbnRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYXBwLW5hdmJhci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FwcC5hY3Rpdml0aWVzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYXBwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYXBwLm1vZGFscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FwcC5zaGVsbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2NvbXBvbmVudHMvQWN0aXZpdHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9jb21wb25lbnRzL0RhdGVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9jb21wb25lbnRzL1NtYXJ0TmF2QmFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbG9jYWxlcy9lbi1VUy1MQy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9BZGRyZXNzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0FwcG9pbnRtZW50LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0Jvb2tpbmcuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQm9va2luZ1N1bW1hcnkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQ2FsZW5kYXJFdmVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9DYWxlbmRhclN5bmNpbmcuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQ2xpZW50LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0dldE1vcmUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvSm9iVGl0bGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvSm9iVGl0bGVQcmljaW5nVHlwZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9MaXN0Vmlld0l0ZW0uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvTG9jYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvTWFpbEZvbGRlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9NYXJrZXRwbGFjZVByb2ZpbGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvTWVzc2FnZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9Nb2RlbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9QZXJmb3JtYW5jZVN1bW1hcnkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvUG9zaXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvUHJpY2luZ1R5cGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvUHJpdmFjeVNldHRpbmdzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1NjaGVkdWxpbmdQcmVmZXJlbmNlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9TZXJ2aWNlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1NpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9VcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9Vc2VyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1VzZXJKb2JUaXRsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3Rlc3RkYXRhL2NsaWVudHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9sb2NhdGlvbnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9tZXNzYWdlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3Rlc3RkYXRhL3NlcnZpY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdGVzdGRhdGEvdGltZVNsb3RzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvQ2FjaGVDb250cm9sLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvRnVuY3Rpb24ucHJvdG90eXBlLl9kZWxheWVkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvRnVuY3Rpb24ucHJvdG90eXBlLl9pbmhlcml0cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL01vZGVsVmVyc2lvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL1JlbW90ZU1vZGVsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvUmVzdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL1RpbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9hY2Nlc3NDb250cm9sLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvYXBpSGVscGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvYm9vdGtub2NrQmluZGluZ0hlbHBlcnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9ib290c3RyYXBTd2l0Y2hCaW5kaW5nLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvZXNjYXBlUmVnRXhwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvZXNjYXBlU2VsZWN0b3IuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9nZXRPYnNlcnZhYmxlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvZ2V0VXJsUXVlcnkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9qcXVlcnkubXVsdGlsaW5lLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvanNQcm9wZXJ0aWVzVG9vbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9Eb21JdGVtc01hbmFnZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9TaGVsbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL2Fic29sdXRpemVVcmwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9kZXBlbmRlbmNpZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9oYXNoYmFuZ0hpc3RvcnkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9pbmRleC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL2xvYWRlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL3BhcnNlVXJsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvc2hlbGwvc2FuaXRpemVVcmwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLWFjY291bnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLWV2ZW50cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwuYXBwb2ludG1lbnRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9BcHBNb2RlbC5ib29raW5ncy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwuY2FsZW5kYXJFdmVudHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLmNhbGVuZGFyU3luY2luZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwuaG9tZUFkZHJlc3MuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLmpvYlRpdGxlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLm1hcmtldHBsYWNlUHJvZmlsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwucHJpdmFjeVNldHRpbmdzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9BcHBNb2RlbC5zY2hlZHVsaW5nUHJlZmVyZW5jZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLnNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwudXNlckpvYlByb2ZpbGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLnVzZXJQcm9maWxlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9Gb3JtQ3JlZGVudGlhbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL05hdkFjdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvTmF2QmFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9UaW1lU2xvdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvVXNlckpvYlByb2ZpbGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdnFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6WEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIG51bWVyYWwuanNcbiAqIHZlcnNpb24gOiAxLjUuM1xuICogYXV0aG9yIDogQWRhbSBEcmFwZXJcbiAqIGxpY2Vuc2UgOiBNSVRcbiAqIGh0dHA6Ly9hZGFtd2RyYXBlci5naXRodWIuY29tL051bWVyYWwtanMvXG4gKi9cblxuKGZ1bmN0aW9uICgpIHtcblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgQ29uc3RhbnRzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgdmFyIG51bWVyYWwsXG4gICAgICAgIFZFUlNJT04gPSAnMS41LjMnLFxuICAgICAgICAvLyBpbnRlcm5hbCBzdG9yYWdlIGZvciBsYW5ndWFnZSBjb25maWcgZmlsZXNcbiAgICAgICAgbGFuZ3VhZ2VzID0ge30sXG4gICAgICAgIGN1cnJlbnRMYW5ndWFnZSA9ICdlbicsXG4gICAgICAgIHplcm9Gb3JtYXQgPSBudWxsLFxuICAgICAgICBkZWZhdWx0Rm9ybWF0ID0gJzAsMCcsXG4gICAgICAgIC8vIGNoZWNrIGZvciBub2RlSlNcbiAgICAgICAgaGFzTW9kdWxlID0gKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKTtcblxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBDb25zdHJ1Y3RvcnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIC8vIE51bWVyYWwgcHJvdG90eXBlIG9iamVjdFxuICAgIGZ1bmN0aW9uIE51bWVyYWwgKG51bWJlcikge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IG51bWJlcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbXBsZW1lbnRhdGlvbiBvZiB0b0ZpeGVkKCkgdGhhdCB0cmVhdHMgZmxvYXRzIG1vcmUgbGlrZSBkZWNpbWFsc1xuICAgICAqXG4gICAgICogRml4ZXMgYmluYXJ5IHJvdW5kaW5nIGlzc3VlcyAoZWcuICgwLjYxNSkudG9GaXhlZCgyKSA9PT0gJzAuNjEnKSB0aGF0IHByZXNlbnRcbiAgICAgKiBwcm9ibGVtcyBmb3IgYWNjb3VudGluZy0gYW5kIGZpbmFuY2UtcmVsYXRlZCBzb2Z0d2FyZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0b0ZpeGVkICh2YWx1ZSwgcHJlY2lzaW9uLCByb3VuZGluZ0Z1bmN0aW9uLCBvcHRpb25hbHMpIHtcbiAgICAgICAgdmFyIHBvd2VyID0gTWF0aC5wb3coMTAsIHByZWNpc2lvbiksXG4gICAgICAgICAgICBvcHRpb25hbHNSZWdFeHAsXG4gICAgICAgICAgICBvdXRwdXQ7XG4gICAgICAgICAgICBcbiAgICAgICAgLy9yb3VuZGluZ0Z1bmN0aW9uID0gKHJvdW5kaW5nRnVuY3Rpb24gIT09IHVuZGVmaW5lZCA/IHJvdW5kaW5nRnVuY3Rpb24gOiBNYXRoLnJvdW5kKTtcbiAgICAgICAgLy8gTXVsdGlwbHkgdXAgYnkgcHJlY2lzaW9uLCByb3VuZCBhY2N1cmF0ZWx5LCB0aGVuIGRpdmlkZSBhbmQgdXNlIG5hdGl2ZSB0b0ZpeGVkKCk6XG4gICAgICAgIG91dHB1dCA9IChyb3VuZGluZ0Z1bmN0aW9uKHZhbHVlICogcG93ZXIpIC8gcG93ZXIpLnRvRml4ZWQocHJlY2lzaW9uKTtcblxuICAgICAgICBpZiAob3B0aW9uYWxzKSB7XG4gICAgICAgICAgICBvcHRpb25hbHNSZWdFeHAgPSBuZXcgUmVnRXhwKCcwezEsJyArIG9wdGlvbmFscyArICd9JCcpO1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2Uob3B0aW9uYWxzUmVnRXhwLCAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRm9ybWF0dGluZ1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIC8vIGRldGVybWluZSB3aGF0IHR5cGUgb2YgZm9ybWF0dGluZyB3ZSBuZWVkIHRvIGRvXG4gICAgZnVuY3Rpb24gZm9ybWF0TnVtZXJhbCAobiwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgIHZhciBvdXRwdXQ7XG5cbiAgICAgICAgLy8gZmlndXJlIG91dCB3aGF0IGtpbmQgb2YgZm9ybWF0IHdlIGFyZSBkZWFsaW5nIHdpdGhcbiAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCckJykgPiAtMSkgeyAvLyBjdXJyZW5jeSEhISEhXG4gICAgICAgICAgICBvdXRwdXQgPSBmb3JtYXRDdXJyZW5jeShuLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdC5pbmRleE9mKCclJykgPiAtMSkgeyAvLyBwZXJjZW50YWdlXG4gICAgICAgICAgICBvdXRwdXQgPSBmb3JtYXRQZXJjZW50YWdlKG4sIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0LmluZGV4T2YoJzonKSA+IC0xKSB7IC8vIHRpbWVcbiAgICAgICAgICAgIG91dHB1dCA9IGZvcm1hdFRpbWUobiwgZm9ybWF0KTtcbiAgICAgICAgfSBlbHNlIHsgLy8gcGxhaW4gb2wnIG51bWJlcnMgb3IgYnl0ZXNcbiAgICAgICAgICAgIG91dHB1dCA9IGZvcm1hdE51bWJlcihuLl92YWx1ZSwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJldHVybiBzdHJpbmdcbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICAvLyByZXZlcnQgdG8gbnVtYmVyXG4gICAgZnVuY3Rpb24gdW5mb3JtYXROdW1lcmFsIChuLCBzdHJpbmcpIHtcbiAgICAgICAgdmFyIHN0cmluZ09yaWdpbmFsID0gc3RyaW5nLFxuICAgICAgICAgICAgdGhvdXNhbmRSZWdFeHAsXG4gICAgICAgICAgICBtaWxsaW9uUmVnRXhwLFxuICAgICAgICAgICAgYmlsbGlvblJlZ0V4cCxcbiAgICAgICAgICAgIHRyaWxsaW9uUmVnRXhwLFxuICAgICAgICAgICAgc3VmZml4ZXMgPSBbJ0tCJywgJ01CJywgJ0dCJywgJ1RCJywgJ1BCJywgJ0VCJywgJ1pCJywgJ1lCJ10sXG4gICAgICAgICAgICBieXRlc011bHRpcGxpZXIgPSBmYWxzZSxcbiAgICAgICAgICAgIHBvd2VyO1xuXG4gICAgICAgIGlmIChzdHJpbmcuaW5kZXhPZignOicpID4gLTEpIHtcbiAgICAgICAgICAgIG4uX3ZhbHVlID0gdW5mb3JtYXRUaW1lKHN0cmluZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoc3RyaW5nID09PSB6ZXJvRm9ybWF0KSB7XG4gICAgICAgICAgICAgICAgbi5fdmFsdWUgPSAwO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uZGVsaW1pdGVycy5kZWNpbWFsICE9PSAnLicpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnJlcGxhY2UoL1xcLi9nLCcnKS5yZXBsYWNlKGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmRlbGltaXRlcnMuZGVjaW1hbCwgJy4nKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBzZWUgaWYgYWJicmV2aWF0aW9ucyBhcmUgdGhlcmUgc28gdGhhdCB3ZSBjYW4gbXVsdGlwbHkgdG8gdGhlIGNvcnJlY3QgbnVtYmVyXG4gICAgICAgICAgICAgICAgdGhvdXNhbmRSZWdFeHAgPSBuZXcgUmVnRXhwKCdbXmEtekEtWl0nICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy50aG91c2FuZCArICcoPzpcXFxcKXwoXFxcXCcgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyAnKT8oPzpcXFxcKSk/KT8kJyk7XG4gICAgICAgICAgICAgICAgbWlsbGlvblJlZ0V4cCA9IG5ldyBSZWdFeHAoJ1teYS16QS1aXScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLm1pbGxpb24gKyAnKD86XFxcXCl8KFxcXFwnICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgJyk/KD86XFxcXCkpPyk/JCcpO1xuICAgICAgICAgICAgICAgIGJpbGxpb25SZWdFeHAgPSBuZXcgUmVnRXhwKCdbXmEtekEtWl0nICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy5iaWxsaW9uICsgJyg/OlxcXFwpfChcXFxcJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCArICcpPyg/OlxcXFwpKT8pPyQnKTtcbiAgICAgICAgICAgICAgICB0cmlsbGlvblJlZ0V4cCA9IG5ldyBSZWdFeHAoJ1teYS16QS1aXScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLnRyaWxsaW9uICsgJyg/OlxcXFwpfChcXFxcJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCArICcpPyg/OlxcXFwpKT8pPyQnKTtcblxuICAgICAgICAgICAgICAgIC8vIHNlZSBpZiBieXRlcyBhcmUgdGhlcmUgc28gdGhhdCB3ZSBjYW4gbXVsdGlwbHkgdG8gdGhlIGNvcnJlY3QgbnVtYmVyXG4gICAgICAgICAgICAgICAgZm9yIChwb3dlciA9IDA7IHBvd2VyIDw9IHN1ZmZpeGVzLmxlbmd0aDsgcG93ZXIrKykge1xuICAgICAgICAgICAgICAgICAgICBieXRlc011bHRpcGxpZXIgPSAoc3RyaW5nLmluZGV4T2Yoc3VmZml4ZXNbcG93ZXJdKSA+IC0xKSA/IE1hdGgucG93KDEwMjQsIHBvd2VyICsgMSkgOiBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYnl0ZXNNdWx0aXBsaWVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGRvIHNvbWUgbWF0aCB0byBjcmVhdGUgb3VyIG51bWJlclxuICAgICAgICAgICAgICAgIG4uX3ZhbHVlID0gKChieXRlc011bHRpcGxpZXIpID8gYnl0ZXNNdWx0aXBsaWVyIDogMSkgKiAoKHN0cmluZ09yaWdpbmFsLm1hdGNoKHRob3VzYW5kUmVnRXhwKSkgPyBNYXRoLnBvdygxMCwgMykgOiAxKSAqICgoc3RyaW5nT3JpZ2luYWwubWF0Y2gobWlsbGlvblJlZ0V4cCkpID8gTWF0aC5wb3coMTAsIDYpIDogMSkgKiAoKHN0cmluZ09yaWdpbmFsLm1hdGNoKGJpbGxpb25SZWdFeHApKSA/IE1hdGgucG93KDEwLCA5KSA6IDEpICogKChzdHJpbmdPcmlnaW5hbC5tYXRjaCh0cmlsbGlvblJlZ0V4cCkpID8gTWF0aC5wb3coMTAsIDEyKSA6IDEpICogKChzdHJpbmcuaW5kZXhPZignJScpID4gLTEpID8gMC4wMSA6IDEpICogKCgoc3RyaW5nLnNwbGl0KCctJykubGVuZ3RoICsgTWF0aC5taW4oc3RyaW5nLnNwbGl0KCcoJykubGVuZ3RoLTEsIHN0cmluZy5zcGxpdCgnKScpLmxlbmd0aC0xKSkgJSAyKT8gMTogLTEpICogTnVtYmVyKHN0cmluZy5yZXBsYWNlKC9bXjAtOVxcLl0rL2csICcnKSk7XG5cbiAgICAgICAgICAgICAgICAvLyByb3VuZCBpZiB3ZSBhcmUgdGFsa2luZyBhYm91dCBieXRlc1xuICAgICAgICAgICAgICAgIG4uX3ZhbHVlID0gKGJ5dGVzTXVsdGlwbGllcikgPyBNYXRoLmNlaWwobi5fdmFsdWUpIDogbi5fdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG4uX3ZhbHVlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZvcm1hdEN1cnJlbmN5IChuLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIHN5bWJvbEluZGV4ID0gZm9ybWF0LmluZGV4T2YoJyQnKSxcbiAgICAgICAgICAgIG9wZW5QYXJlbkluZGV4ID0gZm9ybWF0LmluZGV4T2YoJygnKSxcbiAgICAgICAgICAgIG1pbnVzU2lnbkluZGV4ID0gZm9ybWF0LmluZGV4T2YoJy0nKSxcbiAgICAgICAgICAgIHNwYWNlID0gJycsXG4gICAgICAgICAgICBzcGxpY2VJbmRleCxcbiAgICAgICAgICAgIG91dHB1dDtcblxuICAgICAgICAvLyBjaGVjayBmb3Igc3BhY2UgYmVmb3JlIG9yIGFmdGVyIGN1cnJlbmN5XG4gICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignICQnKSA+IC0xKSB7XG4gICAgICAgICAgICBzcGFjZSA9ICcgJztcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCcgJCcsICcnKTtcbiAgICAgICAgfSBlbHNlIGlmIChmb3JtYXQuaW5kZXhPZignJCAnKSA+IC0xKSB7XG4gICAgICAgICAgICBzcGFjZSA9ICcgJztcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCckICcsICcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCckJywgJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZm9ybWF0IHRoZSBudW1iZXJcbiAgICAgICAgb3V0cHV0ID0gZm9ybWF0TnVtYmVyKG4uX3ZhbHVlLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pO1xuXG4gICAgICAgIC8vIHBvc2l0aW9uIHRoZSBzeW1ib2xcbiAgICAgICAgaWYgKHN5bWJvbEluZGV4IDw9IDEpIHtcbiAgICAgICAgICAgIGlmIChvdXRwdXQuaW5kZXhPZignKCcpID4gLTEgfHwgb3V0cHV0LmluZGV4T2YoJy0nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnNwbGl0KCcnKTtcbiAgICAgICAgICAgICAgICBzcGxpY2VJbmRleCA9IDE7XG4gICAgICAgICAgICAgICAgaWYgKHN5bWJvbEluZGV4IDwgb3BlblBhcmVuSW5kZXggfHwgc3ltYm9sSW5kZXggPCBtaW51c1NpZ25JbmRleCl7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBzeW1ib2wgYXBwZWFycyBiZWZvcmUgdGhlIFwiKFwiIG9yIFwiLVwiXG4gICAgICAgICAgICAgICAgICAgIHNwbGljZUluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb3V0cHV0LnNwbGljZShzcGxpY2VJbmRleCwgMCwgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgc3BhY2UpO1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5qb2luKCcnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgc3BhY2UgKyBvdXRwdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAob3V0cHV0LmluZGV4T2YoJyknKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnNwbGl0KCcnKTtcbiAgICAgICAgICAgICAgICBvdXRwdXQuc3BsaWNlKC0xLCAwLCBzcGFjZSArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCk7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LmpvaW4oJycpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQgKyBzcGFjZSArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0UGVyY2VudGFnZSAobiwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgIHZhciBzcGFjZSA9ICcnLFxuICAgICAgICAgICAgb3V0cHV0LFxuICAgICAgICAgICAgdmFsdWUgPSBuLl92YWx1ZSAqIDEwMDtcblxuICAgICAgICAvLyBjaGVjayBmb3Igc3BhY2UgYmVmb3JlICVcbiAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcgJScpID4gLTEpIHtcbiAgICAgICAgICAgIHNwYWNlID0gJyAnO1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyAlJywgJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyUnLCAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICBvdXRwdXQgPSBmb3JtYXROdW1iZXIodmFsdWUsIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgIFxuICAgICAgICBpZiAob3V0cHV0LmluZGV4T2YoJyknKSA+IC0xICkge1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnNwbGl0KCcnKTtcbiAgICAgICAgICAgIG91dHB1dC5zcGxpY2UoLTEsIDAsIHNwYWNlICsgJyUnKTtcbiAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5qb2luKCcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dCArIHNwYWNlICsgJyUnO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXRUaW1lIChuKSB7XG4gICAgICAgIHZhciBob3VycyA9IE1hdGguZmxvb3Iobi5fdmFsdWUvNjAvNjApLFxuICAgICAgICAgICAgbWludXRlcyA9IE1hdGguZmxvb3IoKG4uX3ZhbHVlIC0gKGhvdXJzICogNjAgKiA2MCkpLzYwKSxcbiAgICAgICAgICAgIHNlY29uZHMgPSBNYXRoLnJvdW5kKG4uX3ZhbHVlIC0gKGhvdXJzICogNjAgKiA2MCkgLSAobWludXRlcyAqIDYwKSk7XG4gICAgICAgIHJldHVybiBob3VycyArICc6JyArICgobWludXRlcyA8IDEwKSA/ICcwJyArIG1pbnV0ZXMgOiBtaW51dGVzKSArICc6JyArICgoc2Vjb25kcyA8IDEwKSA/ICcwJyArIHNlY29uZHMgOiBzZWNvbmRzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bmZvcm1hdFRpbWUgKHN0cmluZykge1xuICAgICAgICB2YXIgdGltZUFycmF5ID0gc3RyaW5nLnNwbGl0KCc6JyksXG4gICAgICAgICAgICBzZWNvbmRzID0gMDtcbiAgICAgICAgLy8gdHVybiBob3VycyBhbmQgbWludXRlcyBpbnRvIHNlY29uZHMgYW5kIGFkZCB0aGVtIGFsbCB1cFxuICAgICAgICBpZiAodGltZUFycmF5Lmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgLy8gaG91cnNcbiAgICAgICAgICAgIHNlY29uZHMgPSBzZWNvbmRzICsgKE51bWJlcih0aW1lQXJyYXlbMF0pICogNjAgKiA2MCk7XG4gICAgICAgICAgICAvLyBtaW51dGVzXG4gICAgICAgICAgICBzZWNvbmRzID0gc2Vjb25kcyArIChOdW1iZXIodGltZUFycmF5WzFdKSAqIDYwKTtcbiAgICAgICAgICAgIC8vIHNlY29uZHNcbiAgICAgICAgICAgIHNlY29uZHMgPSBzZWNvbmRzICsgTnVtYmVyKHRpbWVBcnJheVsyXSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGltZUFycmF5Lmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgLy8gbWludXRlc1xuICAgICAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgKyAoTnVtYmVyKHRpbWVBcnJheVswXSkgKiA2MCk7XG4gICAgICAgICAgICAvLyBzZWNvbmRzXG4gICAgICAgICAgICBzZWNvbmRzID0gc2Vjb25kcyArIE51bWJlcih0aW1lQXJyYXlbMV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBOdW1iZXIoc2Vjb25kcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0TnVtYmVyICh2YWx1ZSwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgIHZhciBuZWdQID0gZmFsc2UsXG4gICAgICAgICAgICBzaWduZWQgPSBmYWxzZSxcbiAgICAgICAgICAgIG9wdERlYyA9IGZhbHNlLFxuICAgICAgICAgICAgYWJiciA9ICcnLFxuICAgICAgICAgICAgYWJicksgPSBmYWxzZSwgLy8gZm9yY2UgYWJicmV2aWF0aW9uIHRvIHRob3VzYW5kc1xuICAgICAgICAgICAgYWJick0gPSBmYWxzZSwgLy8gZm9yY2UgYWJicmV2aWF0aW9uIHRvIG1pbGxpb25zXG4gICAgICAgICAgICBhYmJyQiA9IGZhbHNlLCAvLyBmb3JjZSBhYmJyZXZpYXRpb24gdG8gYmlsbGlvbnNcbiAgICAgICAgICAgIGFiYnJUID0gZmFsc2UsIC8vIGZvcmNlIGFiYnJldmlhdGlvbiB0byB0cmlsbGlvbnNcbiAgICAgICAgICAgIGFiYnJGb3JjZSA9IGZhbHNlLCAvLyBmb3JjZSBhYmJyZXZpYXRpb25cbiAgICAgICAgICAgIGJ5dGVzID0gJycsXG4gICAgICAgICAgICBvcmQgPSAnJyxcbiAgICAgICAgICAgIGFicyA9IE1hdGguYWJzKHZhbHVlKSxcbiAgICAgICAgICAgIHN1ZmZpeGVzID0gWydCJywgJ0tCJywgJ01CJywgJ0dCJywgJ1RCJywgJ1BCJywgJ0VCJywgJ1pCJywgJ1lCJ10sXG4gICAgICAgICAgICBtaW4sXG4gICAgICAgICAgICBtYXgsXG4gICAgICAgICAgICBwb3dlcixcbiAgICAgICAgICAgIHcsXG4gICAgICAgICAgICBwcmVjaXNpb24sXG4gICAgICAgICAgICB0aG91c2FuZHMsXG4gICAgICAgICAgICBkID0gJycsXG4gICAgICAgICAgICBuZWcgPSBmYWxzZTtcblxuICAgICAgICAvLyBjaGVjayBpZiBudW1iZXIgaXMgemVybyBhbmQgYSBjdXN0b20gemVybyBmb3JtYXQgaGFzIGJlZW4gc2V0XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gMCAmJiB6ZXJvRm9ybWF0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gemVyb0Zvcm1hdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHNlZSBpZiB3ZSBzaG91bGQgdXNlIHBhcmVudGhlc2VzIGZvciBuZWdhdGl2ZSBudW1iZXIgb3IgaWYgd2Ugc2hvdWxkIHByZWZpeCB3aXRoIGEgc2lnblxuICAgICAgICAgICAgLy8gaWYgYm90aCBhcmUgcHJlc2VudCB3ZSBkZWZhdWx0IHRvIHBhcmVudGhlc2VzXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJygnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgbmVnUCA9IHRydWU7XG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnNsaWNlKDEsIC0xKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0LmluZGV4T2YoJysnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgc2lnbmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgvXFwrL2csICcnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2VlIGlmIGFiYnJldmlhdGlvbiBpcyB3YW50ZWRcbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignYScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiBhYmJyZXZpYXRpb24gaXMgc3BlY2lmaWVkXG4gICAgICAgICAgICAgICAgYWJicksgPSBmb3JtYXQuaW5kZXhPZignYUsnKSA+PSAwO1xuICAgICAgICAgICAgICAgIGFiYnJNID0gZm9ybWF0LmluZGV4T2YoJ2FNJykgPj0gMDtcbiAgICAgICAgICAgICAgICBhYmJyQiA9IGZvcm1hdC5pbmRleE9mKCdhQicpID49IDA7XG4gICAgICAgICAgICAgICAgYWJiclQgPSBmb3JtYXQuaW5kZXhPZignYVQnKSA+PSAwO1xuICAgICAgICAgICAgICAgIGFiYnJGb3JjZSA9IGFiYnJLIHx8IGFiYnJNIHx8IGFiYnJCIHx8IGFiYnJUO1xuXG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgZm9yIHNwYWNlIGJlZm9yZSBhYmJyZXZpYXRpb25cbiAgICAgICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyBhJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBhYmJyID0gJyAnO1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnIGEnLCAnJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJ2EnLCAnJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGFicyA+PSBNYXRoLnBvdygxMCwgMTIpICYmICFhYmJyRm9yY2UgfHwgYWJiclQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdHJpbGxpb25cbiAgICAgICAgICAgICAgICAgICAgYWJiciA9IGFiYnIgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLnRyaWxsaW9uO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gTWF0aC5wb3coMTAsIDEyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFicyA8IE1hdGgucG93KDEwLCAxMikgJiYgYWJzID49IE1hdGgucG93KDEwLCA5KSAmJiAhYWJickZvcmNlIHx8IGFiYnJCKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGJpbGxpb25cbiAgICAgICAgICAgICAgICAgICAgYWJiciA9IGFiYnIgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLmJpbGxpb247XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgOSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhYnMgPCBNYXRoLnBvdygxMCwgOSkgJiYgYWJzID49IE1hdGgucG93KDEwLCA2KSAmJiAhYWJickZvcmNlIHx8IGFiYnJNKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1pbGxpb25cbiAgICAgICAgICAgICAgICAgICAgYWJiciA9IGFiYnIgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLm1pbGxpb247XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgNik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhYnMgPCBNYXRoLnBvdygxMCwgNikgJiYgYWJzID49IE1hdGgucG93KDEwLCAzKSAmJiAhYWJickZvcmNlIHx8IGFiYnJLKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRob3VzYW5kXG4gICAgICAgICAgICAgICAgICAgIGFiYnIgPSBhYmJyICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy50aG91c2FuZDtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KDEwLCAzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNlZSBpZiB3ZSBhcmUgZm9ybWF0dGluZyBieXRlc1xuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCdiJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGZvciBzcGFjZSBiZWZvcmVcbiAgICAgICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyBiJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBieXRlcyA9ICcgJztcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyBiJywgJycpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCdiJywgJycpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAocG93ZXIgPSAwOyBwb3dlciA8PSBzdWZmaXhlcy5sZW5ndGg7IHBvd2VyKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbWluID0gTWF0aC5wb3coMTAyNCwgcG93ZXIpO1xuICAgICAgICAgICAgICAgICAgICBtYXggPSBNYXRoLnBvdygxMDI0LCBwb3dlcisxKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPj0gbWluICYmIHZhbHVlIDwgbWF4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBieXRlcyA9IGJ5dGVzICsgc3VmZml4ZXNbcG93ZXJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1pbiA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gbWluO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNlZSBpZiBvcmRpbmFsIGlzIHdhbnRlZFxuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCdvJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGZvciBzcGFjZSBiZWZvcmVcbiAgICAgICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyBvJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBvcmQgPSAnICc7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCcgbycsICcnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnbycsICcnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBvcmQgPSBvcmQgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5vcmRpbmFsKHZhbHVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCdbLl0nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgb3B0RGVjID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnWy5dJywgJy4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdyA9IHZhbHVlLnRvU3RyaW5nKCkuc3BsaXQoJy4nKVswXTtcbiAgICAgICAgICAgIHByZWNpc2lvbiA9IGZvcm1hdC5zcGxpdCgnLicpWzFdO1xuICAgICAgICAgICAgdGhvdXNhbmRzID0gZm9ybWF0LmluZGV4T2YoJywnKTtcblxuICAgICAgICAgICAgaWYgKHByZWNpc2lvbikge1xuICAgICAgICAgICAgICAgIGlmIChwcmVjaXNpb24uaW5kZXhPZignWycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJlY2lzaW9uID0gcHJlY2lzaW9uLnJlcGxhY2UoJ10nLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIHByZWNpc2lvbiA9IHByZWNpc2lvbi5zcGxpdCgnWycpO1xuICAgICAgICAgICAgICAgICAgICBkID0gdG9GaXhlZCh2YWx1ZSwgKHByZWNpc2lvblswXS5sZW5ndGggKyBwcmVjaXNpb25bMV0ubGVuZ3RoKSwgcm91bmRpbmdGdW5jdGlvbiwgcHJlY2lzaW9uWzFdLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZCA9IHRvRml4ZWQodmFsdWUsIHByZWNpc2lvbi5sZW5ndGgsIHJvdW5kaW5nRnVuY3Rpb24pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHcgPSBkLnNwbGl0KCcuJylbMF07XG5cbiAgICAgICAgICAgICAgICBpZiAoZC5zcGxpdCgnLicpWzFdLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBkID0gbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uZGVsaW1pdGVycy5kZWNpbWFsICsgZC5zcGxpdCgnLicpWzFdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGQgPSAnJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0RGVjICYmIE51bWJlcihkLnNsaWNlKDEpKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBkID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB3ID0gdG9GaXhlZCh2YWx1ZSwgbnVsbCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGZvcm1hdCBudW1iZXJcbiAgICAgICAgICAgIGlmICh3LmluZGV4T2YoJy0nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgdyA9IHcuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgbmVnID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRob3VzYW5kcyA+IC0xKSB7XG4gICAgICAgICAgICAgICAgdyA9IHcudG9TdHJpbmcoKS5yZXBsYWNlKC8oXFxkKSg/PShcXGR7M30pKyg/IVxcZCkpL2csICckMScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5kZWxpbWl0ZXJzLnRob3VzYW5kcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignLicpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgdyA9ICcnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gKChuZWdQICYmIG5lZykgPyAnKCcgOiAnJykgKyAoKCFuZWdQICYmIG5lZykgPyAnLScgOiAnJykgKyAoKCFuZWcgJiYgc2lnbmVkKSA/ICcrJyA6ICcnKSArIHcgKyBkICsgKChvcmQpID8gb3JkIDogJycpICsgKChhYmJyKSA/IGFiYnIgOiAnJykgKyAoKGJ5dGVzKSA/IGJ5dGVzIDogJycpICsgKChuZWdQICYmIG5lZykgPyAnKScgOiAnJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIFRvcCBMZXZlbCBGdW5jdGlvbnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICBudW1lcmFsID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgIGlmIChudW1lcmFsLmlzTnVtZXJhbChpbnB1dCkpIHtcbiAgICAgICAgICAgIGlucHV0ID0gaW5wdXQudmFsdWUoKTtcbiAgICAgICAgfSBlbHNlIGlmIChpbnB1dCA9PT0gMCB8fCB0eXBlb2YgaW5wdXQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpbnB1dCA9IDA7XG4gICAgICAgIH0gZWxzZSBpZiAoIU51bWJlcihpbnB1dCkpIHtcbiAgICAgICAgICAgIGlucHV0ID0gbnVtZXJhbC5mbi51bmZvcm1hdChpbnB1dCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IE51bWVyYWwoTnVtYmVyKGlucHV0KSk7XG4gICAgfTtcblxuICAgIC8vIHZlcnNpb24gbnVtYmVyXG4gICAgbnVtZXJhbC52ZXJzaW9uID0gVkVSU0lPTjtcblxuICAgIC8vIGNvbXBhcmUgbnVtZXJhbCBvYmplY3RcbiAgICBudW1lcmFsLmlzTnVtZXJhbCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIE51bWVyYWw7XG4gICAgfTtcblxuICAgIC8vIFRoaXMgZnVuY3Rpb24gd2lsbCBsb2FkIGxhbmd1YWdlcyBhbmQgdGhlbiBzZXQgdGhlIGdsb2JhbCBsYW5ndWFnZS4gIElmXG4gICAgLy8gbm8gYXJndW1lbnRzIGFyZSBwYXNzZWQgaW4sIGl0IHdpbGwgc2ltcGx5IHJldHVybiB0aGUgY3VycmVudCBnbG9iYWxcbiAgICAvLyBsYW5ndWFnZSBrZXkuXG4gICAgbnVtZXJhbC5sYW5ndWFnZSA9IGZ1bmN0aW9uIChrZXksIHZhbHVlcykge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRMYW5ndWFnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChrZXkgJiYgIXZhbHVlcykge1xuICAgICAgICAgICAgaWYoIWxhbmd1YWdlc1trZXldKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGxhbmd1YWdlIDogJyArIGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJyZW50TGFuZ3VhZ2UgPSBrZXk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWVzIHx8ICFsYW5ndWFnZXNba2V5XSkge1xuICAgICAgICAgICAgbG9hZExhbmd1YWdlKGtleSwgdmFsdWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudW1lcmFsO1xuICAgIH07XG4gICAgXG4gICAgLy8gVGhpcyBmdW5jdGlvbiBwcm92aWRlcyBhY2Nlc3MgdG8gdGhlIGxvYWRlZCBsYW5ndWFnZSBkYXRhLiAgSWZcbiAgICAvLyBubyBhcmd1bWVudHMgYXJlIHBhc3NlZCBpbiwgaXQgd2lsbCBzaW1wbHkgcmV0dXJuIHRoZSBjdXJyZW50XG4gICAgLy8gZ2xvYmFsIGxhbmd1YWdlIG9iamVjdC5cbiAgICBudW1lcmFsLmxhbmd1YWdlRGF0YSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFsYW5ndWFnZXNba2V5XSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGxhbmd1YWdlIDogJyArIGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBsYW5ndWFnZXNba2V5XTtcbiAgICB9O1xuXG4gICAgbnVtZXJhbC5sYW5ndWFnZSgnZW4nLCB7XG4gICAgICAgIGRlbGltaXRlcnM6IHtcbiAgICAgICAgICAgIHRob3VzYW5kczogJywnLFxuICAgICAgICAgICAgZGVjaW1hbDogJy4nXG4gICAgICAgIH0sXG4gICAgICAgIGFiYnJldmlhdGlvbnM6IHtcbiAgICAgICAgICAgIHRob3VzYW5kOiAnaycsXG4gICAgICAgICAgICBtaWxsaW9uOiAnbScsXG4gICAgICAgICAgICBiaWxsaW9uOiAnYicsXG4gICAgICAgICAgICB0cmlsbGlvbjogJ3QnXG4gICAgICAgIH0sXG4gICAgICAgIG9yZGluYWw6IGZ1bmN0aW9uIChudW1iZXIpIHtcbiAgICAgICAgICAgIHZhciBiID0gbnVtYmVyICUgMTA7XG4gICAgICAgICAgICByZXR1cm4gKH5+IChudW1iZXIgJSAxMDAgLyAxMCkgPT09IDEpID8gJ3RoJyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDEpID8gJ3N0JyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDIpID8gJ25kJyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDMpID8gJ3JkJyA6ICd0aCc7XG4gICAgICAgIH0sXG4gICAgICAgIGN1cnJlbmN5OiB7XG4gICAgICAgICAgICBzeW1ib2w6ICckJ1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBudW1lcmFsLnplcm9Gb3JtYXQgPSBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgIHplcm9Gb3JtYXQgPSB0eXBlb2YoZm9ybWF0KSA9PT0gJ3N0cmluZycgPyBmb3JtYXQgOiBudWxsO1xuICAgIH07XG5cbiAgICBudW1lcmFsLmRlZmF1bHRGb3JtYXQgPSBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgIGRlZmF1bHRGb3JtYXQgPSB0eXBlb2YoZm9ybWF0KSA9PT0gJ3N0cmluZycgPyBmb3JtYXQgOiAnMC4wJztcbiAgICB9O1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBIZWxwZXJzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgZnVuY3Rpb24gbG9hZExhbmd1YWdlKGtleSwgdmFsdWVzKSB7XG4gICAgICAgIGxhbmd1YWdlc1trZXldID0gdmFsdWVzO1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRmxvYXRpbmctcG9pbnQgaGVscGVyc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIC8vIFRoZSBmbG9hdGluZy1wb2ludCBoZWxwZXIgZnVuY3Rpb25zIGFuZCBpbXBsZW1lbnRhdGlvblxuICAgIC8vIGJvcnJvd3MgaGVhdmlseSBmcm9tIHNpbmZ1bC5qczogaHR0cDovL2d1aXBuLmdpdGh1Yi5pby9zaW5mdWwuanMvXG5cbiAgICAvKipcbiAgICAgKiBBcnJheS5wcm90b3R5cGUucmVkdWNlIGZvciBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgaXRcbiAgICAgKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9SZWR1Y2UjQ29tcGF0aWJpbGl0eVxuICAgICAqL1xuICAgIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgQXJyYXkucHJvdG90eXBlLnJlZHVjZSkge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUucmVkdWNlID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBvcHRfaW5pdGlhbFZhbHVlKSB7XG4gICAgICAgICAgICAndXNlIHN0cmljdCc7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChudWxsID09PSB0aGlzIHx8ICd1bmRlZmluZWQnID09PSB0eXBlb2YgdGhpcykge1xuICAgICAgICAgICAgICAgIC8vIEF0IHRoZSBtb21lbnQgYWxsIG1vZGVybiBicm93c2VycywgdGhhdCBzdXBwb3J0IHN0cmljdCBtb2RlLCBoYXZlXG4gICAgICAgICAgICAgICAgLy8gbmF0aXZlIGltcGxlbWVudGF0aW9uIG9mIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UuIEZvciBpbnN0YW5jZSwgSUU4XG4gICAgICAgICAgICAgICAgLy8gZG9lcyBub3Qgc3VwcG9ydCBzdHJpY3QgbW9kZSwgc28gdGhpcyBjaGVjayBpcyBhY3R1YWxseSB1c2VsZXNzLlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FycmF5LnByb3RvdHlwZS5yZWR1Y2UgY2FsbGVkIG9uIG51bGwgb3IgdW5kZWZpbmVkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGNhbGxiYWNrICsgJyBpcyBub3QgYSBmdW5jdGlvbicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgaW5kZXgsXG4gICAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gdGhpcy5sZW5ndGggPj4+IDAsXG4gICAgICAgICAgICAgICAgaXNWYWx1ZVNldCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAoMSA8IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IG9wdF9pbml0aWFsVmFsdWU7XG4gICAgICAgICAgICAgICAgaXNWYWx1ZVNldCA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoaW5kZXggPSAwOyBsZW5ndGggPiBpbmRleDsgKytpbmRleCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc093blByb3BlcnR5KGluZGV4KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNWYWx1ZVNldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBjYWxsYmFjayh2YWx1ZSwgdGhpc1tpbmRleF0sIGluZGV4LCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdGhpc1tpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpc1ZhbHVlU2V0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFpc1ZhbHVlU2V0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUmVkdWNlIG9mIGVtcHR5IGFycmF5IHdpdGggbm8gaW5pdGlhbCB2YWx1ZScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgXG4gICAgLyoqXG4gICAgICogQ29tcHV0ZXMgdGhlIG11bHRpcGxpZXIgbmVjZXNzYXJ5IHRvIG1ha2UgeCA+PSAxLFxuICAgICAqIGVmZmVjdGl2ZWx5IGVsaW1pbmF0aW5nIG1pc2NhbGN1bGF0aW9ucyBjYXVzZWQgYnlcbiAgICAgKiBmaW5pdGUgcHJlY2lzaW9uLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG11bHRpcGxpZXIoeCkge1xuICAgICAgICB2YXIgcGFydHMgPSB4LnRvU3RyaW5nKCkuc3BsaXQoJy4nKTtcbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNYXRoLnBvdygxMCwgcGFydHNbMV0ubGVuZ3RoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHaXZlbiBhIHZhcmlhYmxlIG51bWJlciBvZiBhcmd1bWVudHMsIHJldHVybnMgdGhlIG1heGltdW1cbiAgICAgKiBtdWx0aXBsaWVyIHRoYXQgbXVzdCBiZSB1c2VkIHRvIG5vcm1hbGl6ZSBhbiBvcGVyYXRpb24gaW52b2x2aW5nXG4gICAgICogYWxsIG9mIHRoZW0uXG4gICAgICovXG4gICAgZnVuY3Rpb24gY29ycmVjdGlvbkZhY3RvcigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gYXJncy5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIG5leHQpIHtcbiAgICAgICAgICAgIHZhciBtcCA9IG11bHRpcGxpZXIocHJldiksXG4gICAgICAgICAgICAgICAgbW4gPSBtdWx0aXBsaWVyKG5leHQpO1xuICAgICAgICByZXR1cm4gbXAgPiBtbiA/IG1wIDogbW47XG4gICAgICAgIH0sIC1JbmZpbml0eSk7XG4gICAgfSAgICAgICAgXG5cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgTnVtZXJhbCBQcm90b3R5cGVcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIG51bWVyYWwuZm4gPSBOdW1lcmFsLnByb3RvdHlwZSA9IHtcblxuICAgICAgICBjbG9uZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBudW1lcmFsKHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZvcm1hdCA6IGZ1bmN0aW9uIChpbnB1dFN0cmluZywgcm91bmRpbmdGdW5jdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdE51bWVyYWwodGhpcywgXG4gICAgICAgICAgICAgICAgICBpbnB1dFN0cmluZyA/IGlucHV0U3RyaW5nIDogZGVmYXVsdEZvcm1hdCwgXG4gICAgICAgICAgICAgICAgICAocm91bmRpbmdGdW5jdGlvbiAhPT0gdW5kZWZpbmVkKSA/IHJvdW5kaW5nRnVuY3Rpb24gOiBNYXRoLnJvdW5kXG4gICAgICAgICAgICAgICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdW5mb3JtYXQgOiBmdW5jdGlvbiAoaW5wdXRTdHJpbmcpIHtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXRTdHJpbmcpID09PSAnW29iamVjdCBOdW1iZXJdJykgeyBcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5wdXRTdHJpbmc7IFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHVuZm9ybWF0TnVtZXJhbCh0aGlzLCBpbnB1dFN0cmluZyA/IGlucHV0U3RyaW5nIDogZGVmYXVsdEZvcm1hdCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdmFsdWUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdmFsdWVPZiA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXQgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gTnVtYmVyKHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZCA6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIGNvcnJGYWN0b3IgPSBjb3JyZWN0aW9uRmFjdG9yLmNhbGwobnVsbCwgdGhpcy5fdmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNiYWNrKGFjY3VtLCBjdXJyLCBjdXJySSwgTykge1xuICAgICAgICAgICAgICAgIHJldHVybiBhY2N1bSArIGNvcnJGYWN0b3IgKiBjdXJyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSBbdGhpcy5fdmFsdWUsIHZhbHVlXS5yZWR1Y2UoY2JhY2ssIDApIC8gY29yckZhY3RvcjtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN1YnRyYWN0IDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgY29yckZhY3RvciA9IGNvcnJlY3Rpb25GYWN0b3IuY2FsbChudWxsLCB0aGlzLl92YWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgZnVuY3Rpb24gY2JhY2soYWNjdW0sIGN1cnIsIGN1cnJJLCBPKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjY3VtIC0gY29yckZhY3RvciAqIGN1cnI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IFt2YWx1ZV0ucmVkdWNlKGNiYWNrLCB0aGlzLl92YWx1ZSAqIGNvcnJGYWN0b3IpIC8gY29yckZhY3RvcjsgICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIG11bHRpcGx5IDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBjYmFjayhhY2N1bSwgY3VyciwgY3VyckksIE8pIHtcbiAgICAgICAgICAgICAgICB2YXIgY29yckZhY3RvciA9IGNvcnJlY3Rpb25GYWN0b3IoYWNjdW0sIGN1cnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiAoYWNjdW0gKiBjb3JyRmFjdG9yKSAqIChjdXJyICogY29yckZhY3RvcikgL1xuICAgICAgICAgICAgICAgICAgICAoY29yckZhY3RvciAqIGNvcnJGYWN0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSBbdGhpcy5fdmFsdWUsIHZhbHVlXS5yZWR1Y2UoY2JhY2ssIDEpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGl2aWRlIDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBjYmFjayhhY2N1bSwgY3VyciwgY3VyckksIE8pIHtcbiAgICAgICAgICAgICAgICB2YXIgY29yckZhY3RvciA9IGNvcnJlY3Rpb25GYWN0b3IoYWNjdW0sIGN1cnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiAoYWNjdW0gKiBjb3JyRmFjdG9yKSAvIChjdXJyICogY29yckZhY3Rvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IFt0aGlzLl92YWx1ZSwgdmFsdWVdLnJlZHVjZShjYmFjayk7ICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBkaWZmZXJlbmNlIDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5hYnMobnVtZXJhbCh0aGlzLl92YWx1ZSkuc3VidHJhY3QodmFsdWUpLnZhbHVlKCkpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBFeHBvc2luZyBOdW1lcmFsXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgLy8gQ29tbW9uSlMgbW9kdWxlIGlzIGRlZmluZWRcbiAgICBpZiAoaGFzTW9kdWxlKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gbnVtZXJhbDtcbiAgICB9XG5cbiAgICAvKmdsb2JhbCBlbmRlcjpmYWxzZSAqL1xuICAgIGlmICh0eXBlb2YgZW5kZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8vIGhlcmUsIGB0aGlzYCBtZWFucyBgd2luZG93YCBpbiB0aGUgYnJvd3Nlciwgb3IgYGdsb2JhbGAgb24gdGhlIHNlcnZlclxuICAgICAgICAvLyBhZGQgYG51bWVyYWxgIGFzIGEgZ2xvYmFsIG9iamVjdCB2aWEgYSBzdHJpbmcgaWRlbnRpZmllcixcbiAgICAgICAgLy8gZm9yIENsb3N1cmUgQ29tcGlsZXIgJ2FkdmFuY2VkJyBtb2RlXG4gICAgICAgIHRoaXNbJ251bWVyYWwnXSA9IG51bWVyYWw7XG4gICAgfVxuXG4gICAgLypnbG9iYWwgZGVmaW5lOmZhbHNlICovXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBudW1lcmFsO1xuICAgICAgICB9KTtcbiAgICB9XG59KS5jYWxsKHRoaXMpO1xuIiwiLyoqXG4gICAgQWNjb3VudCBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEFjY291bnRBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKCdBY2NvdW50Jyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuIiwiLyoqIENhbGVuZGFyIGFjdGl2aXR5ICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbnJlcXVpcmUoJy4uL2NvbXBvbmVudHMvRGF0ZVBpY2tlcicpO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEFwcG9pbnRtZW50QWN0aXZpdHkoKSB7XHJcbiAgICBcclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkZyZWVsYW5jZXI7ICAgIFxyXG4gICAgdGhpcy5tZW51SXRlbSA9ICdjYWxlbmRhcic7XHJcbiAgICBcclxuICAgIC8vIENyZWF0ZSBhIHNwZWNpZmljIGJhY2tBY3Rpb24gdGhhdCBzaG93cyBjdXJyZW50IGRhdGVcclxuICAgIC8vIGFuZCByZXR1cm4gdG8gY2FsZW5kYXIgaW4gY3VycmVudCBkYXRlLlxyXG4gICAgLy8gTGF0ZXIgc29tZSBtb3JlIGNoYW5nZXMgYXJlIGFwcGxpZWQsIHdpdGggdmlld21vZGVsIHJlYWR5XHJcbiAgICB2YXIgYmFja0FjdGlvbiA9IG5ldyBBY3Rpdml0eS5OYXZBY3Rpb24oe1xyXG4gICAgICAgIGxpbms6ICdjYWxlbmRhci8nLCAvLyBQcmVzZXJ2ZSBsYXN0IHNsYXNoLCBmb3IgbGF0ZXIgdXNlXHJcbiAgICAgICAgaWNvbjogQWN0aXZpdHkuTmF2QWN0aW9uLmdvQmFjay5pY29uKCksXHJcbiAgICAgICAgaXNUaXRsZTogdHJ1ZSxcclxuICAgICAgICB0ZXh0OiAnQ2FsZW5kYXInXHJcbiAgICB9KTtcclxuICAgIHRoaXMubmF2QmFyID0gbmV3IEFjdGl2aXR5Lk5hdkJhcih7XHJcbiAgICAgICAgdGl0bGU6ICcnLFxyXG4gICAgICAgIGxlZnRBY3Rpb246IGJhY2tBY3Rpb24sXHJcbiAgICAgICAgcmlnaHRBY3Rpb246IEFjdGl2aXR5Lk5hdkFjdGlvbi5nb0hlbHBJbmRleFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMuJGFwcG9pbnRtZW50VmlldyA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNjYWxlbmRhckFwcG9pbnRtZW50VmlldycpO1xyXG4gICAgdGhpcy4kY2hvb3NlTmV3ID0gJCgnI2NhbGVuZGFyQ2hvb3NlTmV3Jyk7XHJcbiAgICBcclxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XHJcbiAgICAvLyBUT0RPIFJlbW92ZSB0ZXN0IERhdGFcclxuICAgIC8vdGhpcy52aWV3TW9kZWwuYXBwb2ludG1lbnRzKHJlcXVpcmUoJy4uL3Rlc3RkYXRhL2NhbGVuZGFyQXBwb2ludG1lbnRzJykuYXBwb2ludG1lbnRzKTtcclxuICAgIFxyXG4gICAgLy8gVGhpcyB0aXRsZSB0ZXh0IGlzIGR5bmFtaWMsIHdlIG5lZWQgdG8gcmVwbGFjZSBpdCBieSBhIGNvbXB1dGVkIG9ic2VydmFibGVcclxuICAgIC8vIHNob3dpbmcgdGhlIGN1cnJlbnQgZGF0ZVxyXG4gICAgdmFyIGRlZkJhY2tUZXh0ID0gYmFja0FjdGlvbi50ZXh0Ll9pbml0aWFsVmFsdWU7XHJcbiAgICBiYWNrQWN0aW9uLnRleHQgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIGQgPSB0aGlzLnZpZXdNb2RlbC5jdXJyZW50RGF0ZSgpO1xyXG4gICAgICAgIGlmICghZClcclxuICAgICAgICAgICAgLy8gRmFsbGJhY2sgdG8gdGhlIGRlZmF1bHQgdGl0bGVcclxuICAgICAgICAgICAgcmV0dXJuIGRlZkJhY2tUZXh0O1xyXG5cclxuICAgICAgICB2YXIgbSA9IG1vbWVudChkKTtcclxuICAgICAgICB2YXIgdCA9IG0uZm9ybWF0KCdkZGRkIFsoXU0vRFspXScpO1xyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICAvLyBBbmQgdGhlIGxpbmsgaXMgZHluYW1pYyB0b28sIHRvIGFsbG93IHJldHVybiB0byB0aGUgZGF0ZVxyXG4gICAgLy8gdGhhdCBtYXRjaGVzIGN1cnJlbnQgYXBwb2ludG1lbnRcclxuICAgIHZhciBkZWZMaW5rID0gYmFja0FjdGlvbi5saW5rLl9pbml0aWFsVmFsdWU7XHJcbiAgICBiYWNrQWN0aW9uLmxpbmsgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIGQgPSB0aGlzLnZpZXdNb2RlbC5jdXJyZW50RGF0ZSgpO1xyXG4gICAgICAgIGlmICghZClcclxuICAgICAgICAgICAgLy8gRmFsbGJhY2sgdG8gdGhlIGRlZmF1bHQgbGlua1xyXG4gICAgICAgICAgICByZXR1cm4gZGVmTGluaztcclxuXHJcbiAgICAgICAgcmV0dXJuIGRlZkxpbmsgKyBkLnRvSVNPU3RyaW5nKCk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwuY3VycmVudEFwcG9pbnRtZW50LFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uIChhcHQpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICghYXB0KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVXBkYXRlIFVSTCB0byBtYXRjaCB0aGUgYXBwb2ludG1lbnQgSUQgYW5kXHJcbiAgICAgICAgICAgIC8vIHRyYWNrIGl0IHN0YXRlXHJcbiAgICAgICAgICAgIC8vIEdldCBJRCBmcm9tIFVSTCwgdG8gYXZvaWQgZG8gYW55dGhpbmcgaWYgdGhlIHNhbWUuXHJcbiAgICAgICAgICAgIHZhciBhcHRJZCA9IGFwdC5pZCgpLFxyXG4gICAgICAgICAgICAgICAgZm91bmQgPSAvYXBwb2ludG1lbnRcXC8oW15cXC9dKylcXC8oXFwtP1xcZCspL2kuZXhlYyh3aW5kb3cubG9jYXRpb24pLFxyXG4gICAgICAgICAgICAgICAgdXJsSWQgPSBmb3VuZCAmJiBmb3VuZFsyXSB8MCxcclxuICAgICAgICAgICAgICAgIHVybERhdGUgPSBmb3VuZCAmJiBmb3VuZFsxXSxcclxuICAgICAgICAgICAgICAgIGN1ckRhdGVTdHIgPSBnZXREYXRlV2l0aG91dFRpbWUodGhpcy52aWV3TW9kZWwuY3VycmVudERhdGUoKSkudG9JU09TdHJpbmcoKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghZm91bmQgfHxcclxuICAgICAgICAgICAgICAgIHVybElkICE9PSBhcHRJZC50b1N0cmluZygpIHx8XHJcbiAgICAgICAgICAgICAgICB1cmxEYXRlICE9PSBjdXJEYXRlU3RyKSB7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIFRPRE8gc2F2ZSBhIHVzZWZ1bCBzdGF0ZVxyXG4gICAgICAgICAgICAgICAgLy8gTm90IGZvciBub3csIGlzIGZhaWxpbmcsIGJ1dCBzb21ldGhpbmcgYmFzZWQgb246XHJcbiAgICAgICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICAgICAgdmFyIHZpZXdzdGF0ZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBhcHBvaW50bWVudDogYXB0Lm1vZGVsLnRvUGxhaW5PYmplY3QodHJ1ZSlcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAqL1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIElmIHdhcyBhIHJvb3QgVVJMLCBubyBJRCwganVzdCByZXBsYWNlIGN1cnJlbnQgc3RhdGVcclxuICAgICAgICAgICAgICAgIGlmICh1cmxJZCA9PT0gJycpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuaGlzdG9yeS5yZXBsYWNlU3RhdGUobnVsbCwgbnVsbCwgJ2FwcG9pbnRtZW50LycgKyBjdXJEYXRlU3RyICsgJy8nICsgYXB0SWQpO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsICdhcHBvaW50bWVudC8nICsgY3VyRGF0ZVN0ciArICcvJyArIGFwdElkKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gVHJpZ2dlciBhIGxheW91dCB1cGRhdGUsIHJlcXVpcmVkIGJ5IHRoZSBmdWxsLWhlaWdodCBmZWF0dXJlXHJcbiAgICAgICAgICAgICQod2luZG93KS50cmlnZ2VyKCdsYXlvdXRVcGRhdGUnKTtcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG4gICAgLyp0aGlzLmN1cnJlbnRBcHBvaW50bWVudC5zdWJzY3JpYmUoZnVuY3Rpb24oYXB0KSB7XHJcblxyXG4gICAgICAgIHZhciBuZXdEYXRlID0gbnVsbCxcclxuICAgICAgICAgICAgY3VyRGF0ZSA9IHRoaXMuY3VycmVudERhdGUoKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoYXB0ICYmIGFwdC5zdGFydFRpbWUoKSlcclxuICAgICAgICAgICAgbmV3RGF0ZSA9IGdldERhdGVXaXRob3V0VGltZShhcHQuc3RhcnRUaW1lKCkpO1xyXG5cclxuICAgICAgICAvLyBVcGRhdGUgZGF0ZSB3aXRoIHRoZSBuZXcgZnJvbSBjdXJyZW50IGFwcG9pbnRtZW50XHJcbiAgICAgICAgLy8gb3Iga2VlcCB0aGUgY3VycmVudCBkYXRlLCB3aXRoIGxhdGVzdCBmYWxsYmFjayB0byB0aGUgY3VycmVudCBkYXRlXHJcbiAgICAgICAgbmV3RGF0ZSA9IG5ld0RhdGUgfHwgY3VyRGF0ZSB8fCBnZXREYXRlV2l0aG91dFRpbWUoKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAobmV3RGF0ZS50b0lTT1N0cmluZygpICE9PSBjdXJEYXRlLnRvSVNPU3RyaW5nKCkpIHtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50RGF0ZShuZXdEYXRlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxuICAgICovXHJcblxyXG4gICAgLy8gVXBkYXRlICBvbiBjdXJyZW50RGF0ZSBjaGFuZ2VzOlxyXG4gICAgLy8gTk9URTogTG90IG9mIGNvZGUgc2hhcmVkIHdpdGggY2FsZW5kYXIuanNcclxuICAgIHZhciBwcmV2aW91c0RhdGUgPSB0aGlzLnZpZXdNb2RlbC5jdXJyZW50RGF0ZSgpO1xyXG4gICAgcHJldmlvdXNEYXRlID0gcHJldmlvdXNEYXRlICYmIHByZXZpb3VzRGF0ZS50b0lTT1N0cmluZygpO1xyXG4gICAgdmFyIGFwcCA9IHRoaXMuYXBwO1xyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwuY3VycmVudERhdGUsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24gKGRhdGUpIHtcclxuICAgICAgICAgICAgaWYgKCFkYXRlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50cyhbXSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIElNUE9SVEFOVDogVGhlIGRhdGUgb2JqZWN0IG1heSBiZSByZXVzZWQgYW5kIG11dGF0ZWQgYmV0d2VlbiBjYWxsc1xyXG4gICAgICAgICAgICAvLyAobW9zdGx5IGJlY2F1c2UgdGhlIHdpZGdldCBJIHRoaW5rKSwgc28gaXMgYmV0dGVyIHRvIGNyZWF0ZVxyXG4gICAgICAgICAgICAvLyBhIGNsb25lIGFuZCBhdm9pZCBnZXR0aW5nIHJhY2UtY29uZGl0aW9ucyBpbiB0aGUgZGF0YSBkb3dubG9hZGluZy5cclxuICAgICAgICAgICAgZGF0ZSA9IG5ldyBEYXRlKGRhdGUudG9JU09TdHJpbmcoKSk7XHJcblxyXG4gICAgICAgICAgICAvLyBBdm9pZCBkdXBsaWNhdGVkIG5vdGlmaWNhdGlvbiwgdW4tY2hhbmdlZCBkYXRlXHJcbiAgICAgICAgICAgIGlmIChkYXRlLnRvSVNPU3RyaW5nKCkgPT09IHByZXZpb3VzRGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHByZXZpb3VzRGF0ZSA9IGRhdGUudG9JU09TdHJpbmcoKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKHRydWUpO1xyXG5cclxuICAgICAgICAgICAgYXBwLm1vZGVsLmFwcG9pbnRtZW50cy5nZXRBcHBvaW50bWVudHNCeURhdGUoZGF0ZSlcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oYXBwb2ludG1lbnRzTGlzdCkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIElNUE9SVEFOVDogRmlyc3QsIHdlIG5lZWQgdG8gY2hlY2sgdGhhdCB3ZSBhcmVcclxuICAgICAgICAgICAgICAgIC8vIGluIHRoZSBzYW1lIGRhdGUgc3RpbGwsIGJlY2F1c2Ugc2V2ZXJhbCBsb2FkaW5nc1xyXG4gICAgICAgICAgICAgICAgLy8gY2FuIGhhcHBlbiBhdCBhIHRpbWUgKGNoYW5naW5nIHF1aWNrbHkgZnJvbSBkYXRlIHRvIGRhdGVcclxuICAgICAgICAgICAgICAgIC8vIHdpdGhvdXQgd2FpdCBmb3IgZmluaXNoKSwgYXZvaWRpbmcgYSByYWNlLWNvbmRpdGlvblxyXG4gICAgICAgICAgICAgICAgLy8gdGhhdCBjcmVhdGUgZmxpY2tlcmluZyBlZmZlY3RzIG9yIHJlcGxhY2UgdGhlIGRhdGUgZXZlbnRzXHJcbiAgICAgICAgICAgICAgICAvLyBieSB0aGUgZXZlbnRzIGZyb20gb3RoZXIgZGF0ZSwgYmVjYXVzZSBpdCB0b29rcyBtb3JlIGFuIGNoYW5nZWQuXHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBzdGlsbCB0aGlzIGhhcyB0aGUgbWlub3IgYnVnIG9mIGxvc2luZyB0aGUgaXNMb2FkaW5nXHJcbiAgICAgICAgICAgICAgICAvLyBpZiBhIHByZXZpb3VzIHRyaWdnZXJlZCBsb2FkIHN0aWxsIGRpZG4ndCBmaW5pc2hlZDsgaXRzIG1pbm9yXHJcbiAgICAgICAgICAgICAgICAvLyBiZWNhdXNlIGlzIHZlcnkgcmFyZSB0aGF0IGhhcHBlbnMsIG1vdmluZyB0aGlzIHN0dWZmXHJcbiAgICAgICAgICAgICAgICAvLyB0byBhIHNwZWNpYWwgYXBwTW9kZWwgZm9yIG1peGVkIGJvb2tpbmdzIGFuZCBldmVudHMgd2l0aCBcclxuICAgICAgICAgICAgICAgIC8vIHBlciBkYXRlIGNhY2hlIHRoYXQgaW5jbHVkZXMgYSB2aWV3IG9iamVjdCB3aXRoIGlzTG9hZGluZyB3aWxsXHJcbiAgICAgICAgICAgICAgICAvLyBmaXggaXQgYW5kIHJlZHVjZSB0aGlzIGNvbXBsZXhpdHkuXHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0ZS50b0lTT1N0cmluZygpICE9PSB0aGlzLmN1cnJlbnREYXRlKCkudG9JU09TdHJpbmcoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJhY2UgY29uZGl0aW9uLCBub3QgdGhlIHNhbWUhISBvdXQ6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIE5ldyBkYXRlIGxpc3QgbXVzdCBzdGFydCB3aXRoIHRoZSBmaXJzdCBJRCBvZiB0aGUgbGlzdDpcclxuICAgICAgICAgICAgICAgIC8vIFB1dCBjdXJyZW50IElEIHRvIHplcm8gZm9yY2luZ1xyXG4gICAgICAgICAgICAgICAgLy8gY3VycmVudEFwcG9pbnRtZW50IHRvIGxvb2sgZm9yIHRoZSBmaXJzdCBpbiB0aGVcclxuICAgICAgICAgICAgICAgIC8vIG5ldyBsaXN0XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRJRCgwKTtcclxuICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc291cmNlLCBpdCB3aWxsIHVwZGF0ZSBjdXJyZW50QXBwb2ludG1lbnQgdG9vOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBvaW50bWVudHMoYXBwb2ludG1lbnRzTGlzdCB8fCBbXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcoZmFsc2UpO1xyXG5cclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKVxyXG4gICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU2hvdyBmcmVlIG9uIGVycm9yXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50cyhbXSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzTG9hZGluZyhmYWxzZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG1zZyA9ICdFcnJvciBsb2FkaW5nIGNhbGVuZGFyIGV2ZW50cy4nO1xyXG4gICAgICAgICAgICAgICAgYXBwLm1vZGFscy5zaG93RXJyb3Ioe1xyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBtc2csXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVyciAmJiBlcnIuZXJyb3IgfHwgZXJyXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIH0uYmluZCh0aGlzLnZpZXdNb2RlbClcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB2YXIgTW9kZWxWZXJzaW9uID0gcmVxdWlyZSgnLi4vdXRpbHMvTW9kZWxWZXJzaW9uJyk7XHJcblxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwuZWRpdE1vZGUsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oaXNFZGl0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuJGFjdGl2aXR5LnRvZ2dsZUNsYXNzKCdpbi1lZGl0JywgaXNFZGl0KTtcclxuICAgICAgICAgICAgdGhpcy4kYXBwb2ludG1lbnRWaWV3LmZpbmQoJy5BcHBvaW50bWVudENhcmQnKS50b2dnbGVDbGFzcygnaW4tZWRpdCcsIGlzRWRpdCk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy52aWV3TW9kZWwuY3VycmVudElEKCkgPD0gMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgdmVyc2lvbjtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpc0VkaXQpIHtcclxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhbmQgc2V0IGEgdmVyc2lvbiB0byBiZSBlZGl0ZWRcclxuICAgICAgICAgICAgICAgIHZlcnNpb24gPSBuZXcgTW9kZWxWZXJzaW9uKHRoaXMudmlld01vZGVsLmN1cnJlbnRBcHBvaW50bWVudCgpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmVkaXRlZFZlcnNpb24odmVyc2lvbik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5lZGl0ZWRBcHBvaW50bWVudCh2ZXJzaW9uLnZlcnNpb24pO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBTZXR1cCBhdXRvLXNhdmluZ1xyXG4gICAgICAgICAgICAgICAgdmFyIHZ3ID0gdGhpcy52aWV3TW9kZWw7XHJcbiAgICAgICAgICAgICAgICB2ZXJzaW9uLm9uKCdwdXNoJywgZnVuY3Rpb24oc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZ3LmlzU2F2aW5nKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcHAubW9kZWwuYXBwb2ludG1lbnRzLnNldEFwcG9pbnRtZW50KHZlcnNpb24udmVyc2lvbilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oc2F2ZWRBcHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vdmFyIHdhc05ldyA9IHZlcnNpb24ub3JpZ2luYWwuaWQoKSA8IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgd2l0aCByZW1vdGUgZGF0YSwgdGhlIG9yaWdpbmFsIGFwcG9pbnRtZW50IGluIHRoZSB2ZXJzaW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm90IHRoZSBjdXJyZW50QXBwb2ludG1lbnQgb3IgaW4gdGhlIGluZGV4IGluIHRoZSBsaXN0IHRvIGF2b2lkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByYWNlLWNvbmRpdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb24ub3JpZ2luYWwubW9kZWwudXBkYXRlV2l0aChzYXZlZEFwdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHdhc05ldzp0cnVlOiBhZGQgdG8gdGhlIGxpc3QgYW5kIHNvcnQgaXQ/P1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlcmUgaXMgYSB3aXphcmQgZm9yIGJvb2tpbmdzLCBzbyBtYXkgYmUgZGlmZmVyZW50IG9uIHRoYXQgY2FzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTaG93IGVycm9yXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHAubW9kYWxzLnNob3dFcnJvcih7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdUaGVyZSB3YXMgYW4gZXJyb3Igc2F2aW5nIHRoZSBkYXRhLicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVyciAmJiBlcnIuZXJyb3IgfHwgZXJyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERvbid0IHJlcGxpY2F0ZSBlcnJvciwgYWxsb3cgYWx3YXlzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQUxXQVlTOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdncuaXNTYXZpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgdmVyc2lvbj8gUHVzaCBjaGFuZ2VzIVxyXG4gICAgICAgICAgICAgICAgdmVyc2lvbiA9IHRoaXMudmlld01vZGVsLmVkaXRlZFZlcnNpb24oKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKHZlcnNpb24gJiYgdmVyc2lvbi5hcmVEaWZmZXJlbnQoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFB1c2ggdmVyc2lvbiB0byBvcmlnaW5hbCwgd2lsbCBsYXVuY2ggYSByZW1vdGUgdXBkYXRlIFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIGFuaXRoaW5nIGNoYW5nZWRcclxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBhc2sgZm9yIGNvbmZpcm1hdGlvbiBpZiB2ZXJzaW9uIGlzT2Jzb2xldGVcclxuICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uLnB1c2goeyBldmVuSWZPYnNvbGV0ZTogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG59KTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcclxuXHJcbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcclxuICAgIC8qIGpzaGludCBtYXhjb21wbGV4aXR5OjEwICovXHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgXHJcbiAgICB2YXIgczEgPSBvcHRpb25zICYmIG9wdGlvbnMucm91dGUgJiYgb3B0aW9ucy5yb3V0ZS5zZWdtZW50c1swXSxcclxuICAgICAgICBzMiA9IG9wdGlvbnMgJiYgb3B0aW9ucy5yb3V0ZSAmJiBvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzFdLFxyXG4gICAgICAgIGRhdGUsXHJcbiAgICAgICAgaWQ7XHJcblxyXG4gICAgaWYgKC9eXFwtP1xcZCskLy50ZXN0KHMxKSkge1xyXG4gICAgICAgIC8vIGZpcnN0IHBhcmFtZXRlciBpcyBhbiBJRCwgdXNlIGN1cnJlbnQgZGF0ZSBhbmQgdHJ5IHRvIGxvYWQgaWYgcG9zc2libGVcclxuICAgICAgICBkYXRlID0gbmV3IERhdGUoKTtcclxuICAgICAgICBpZCA9IHMxIHwwO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgZGF0ZSA9IGdldERhdGVXaXRob3V0VGltZShzMSk7XHJcbiAgICAgICAgaWQgPSBzMiB8MDtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnZpZXdNb2RlbC5jdXJyZW50SUQoaWQpO1xyXG4gICAgdGhpcy52aWV3TW9kZWwuY3VycmVudERhdGUoZGF0ZSk7XHJcbiAgICBcclxuICAgIC8vIElmIHRoZSByZXF1ZXN0IGluY2x1ZGVzIGFuIGFwcG9pbnRtZW50IHBsYWluIG9iamVjdCwgdGhhdCdzIGFuXHJcbiAgICAvLyBpbi1lZGl0aW5nIGFwcG9pbnRtZW50IHNvIHB1dCBpdCBpbiBwbGFjZSAodG8gcmVzdG9yZSBhIHByZXZpb3VzIGVkaXRpb24pXHJcbiAgICBpZiAodGhpcy5yZXF1ZXN0RGF0YS5hcHBvaW50bWVudCkge1xyXG4gICAgICAgIHRoaXMudmlld01vZGVsLmVkaXRNb2RlKHRydWUpO1xyXG4gICAgICAgIHRoaXMudmlld01vZGVsLmVkaXRlZEFwcG9pbnRtZW50KCkubW9kZWwudXBkYXRlV2l0aCh0aGlzLnJlcXVlc3REYXRhLmFwcG9pbnRtZW50KTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIC8vIE9uIGFueSBvdGhlciBjYXNlLCBhbmQgdG8gcHJldmVudCBiYWQgZWRpdE1vZGUgb24gZW50ZXJpbmcsIFxyXG4gICAgICAgIC8vIGRvIGEgZGlzY2FyZCB0YWh0IHNldHMgZWRpdE1vZGUgb2ZmXHJcbiAgICAgICAgdGhpcy52aWV3TW9kZWwuY2FuY2VsKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSWYgdGhlcmUgYXJlIG9wdGlvbnMgKG1heSBub3QgYmUgb24gc3RhcnR1cCBvclxyXG4gICAgLy8gb24gY2FuY2VsbGVkIGVkaXRpb24pLlxyXG4gICAgLyppZiAob3B0aW9ucyAhPT0gbnVsbCkge1xyXG5cclxuICAgICAgICB2YXIgYm9va2luZyA9IHRoaXMudmlld01vZGVsLmN1cnJlbnRBcHBvaW50bWVudCgpO1xyXG4gICAgICAgIC8vIEl0IGNvbWVzIGJhY2sgZnJvbSB0aGUgdGV4dEVkaXRvci5cclxuICAgICAgICBpZiAob3B0aW9ucy5yZXF1ZXN0ID09PSAndGV4dEVkaXRvcicgJiYgYm9va2luZykge1xyXG5cclxuICAgICAgICAgICAgYm9va2luZ1tvcHRpb25zLmZpZWxkXShvcHRpb25zLnRleHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChvcHRpb25zLnNlbGVjdENsaWVudCA9PT0gdHJ1ZSAmJiBib29raW5nKSB7XHJcblxyXG4gICAgICAgICAgICBib29raW5nLmNsaWVudChvcHRpb25zLnNlbGVjdGVkQ2xpZW50KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodHlwZW9mKG9wdGlvbnMuc2VsZWN0ZWREYXRldGltZSkgIT09ICd1bmRlZmluZWQnICYmIGJvb2tpbmcpIHtcclxuXHJcbiAgICAgICAgICAgIGJvb2tpbmcuc3RhcnRUaW1lKG9wdGlvbnMuc2VsZWN0ZWREYXRldGltZSk7XHJcbiAgICAgICAgICAgIC8vIFRPRE8gQ2FsY3VsYXRlIHRoZSBlbmRUaW1lIGdpdmVuIGFuIGFwcG9pbnRtZW50IGR1cmF0aW9uLCByZXRyaWV2ZWQgZnJvbSB0aGVcclxuICAgICAgICAgICAgLy8gc2VsZWN0ZWQgc2VydmljZVxyXG4gICAgICAgICAgICAvL3ZhciBkdXJhdGlvbiA9IGJvb2tpbmcucHJpY2luZyAmJiBib29raW5nLnByaWNpbmcuZHVyYXRpb247XHJcbiAgICAgICAgICAgIC8vIE9yIGJ5IGRlZmF1bHQgKGlmIG5vIHByaWNpbmcgc2VsZWN0ZWQgb3IgYW55KSB0aGUgdXNlciBwcmVmZXJyZWRcclxuICAgICAgICAgICAgLy8gdGltZSBnYXBcclxuICAgICAgICAgICAgLy9kdXJhdGlvbiA9IGR1cmF0aW9uIHx8IHVzZXIucHJlZmVyZW5jZXMudGltZVNsb3RzR2FwO1xyXG4gICAgICAgICAgICAvLyBQUk9UT1RZUEU6XHJcbiAgICAgICAgICAgIHZhciBkdXJhdGlvbiA9IDYwOyAvLyBtaW51dGVzXHJcbiAgICAgICAgICAgIGJvb2tpbmcuZW5kVGltZShtb21lbnQoYm9va2luZy5zdGFydFRpbWUoKSkuYWRkKGR1cmF0aW9uLCAnbWludXRlcycpLnRvRGF0ZSgpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5zZWxlY3RTZXJ2aWNlcyA9PT0gdHJ1ZSAmJiBib29raW5nKSB7XHJcblxyXG4gICAgICAgICAgICBib29raW5nLnNlcnZpY2VzKG9wdGlvbnMuc2VsZWN0ZWRTZXJ2aWNlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKG9wdGlvbnMuc2VsZWN0TG9jYXRpb24gPT09IHRydWUgJiYgYm9va2luZykge1xyXG5cclxuICAgICAgICAgICAgYm9va2luZy5sb2NhdGlvbihvcHRpb25zLnNlbGVjdGVkTG9jYXRpb24pO1xyXG4gICAgICAgIH1cclxuICAgIH0qL1xyXG59O1xyXG5cclxudmFyIEFwcG9pbnRtZW50ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0FwcG9pbnRtZW50Jyk7XHJcblxyXG5mdW5jdGlvbiBnZXREYXRlV2l0aG91dFRpbWUoZGF0ZSkge1xyXG4gICAgaWYgKCFkYXRlKSB7XHJcbiAgICAgICAgZGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICghKGRhdGUgaW5zdGFuY2VvZiBEYXRlKSkge1xyXG4gICAgICAgIGRhdGUgPSBuZXcgRGF0ZShkYXRlKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IERhdGUoXHJcbiAgICAgICAgZGF0ZS5nZXRGdWxsWWVhcigpLFxyXG4gICAgICAgIGRhdGUuZ2V0TW9udGgoKSxcclxuICAgICAgICBkYXRlLmdldERhdGUoKSxcclxuICAgICAgICAwLCAwLCAwXHJcbiAgICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kQXBwb2ludG1lbnRJbkxpc3QobGlzdCwgaWQpIHtcclxuICAgIHZhciBmb3VuZCA9IG51bGwsXHJcbiAgICAgICAgaW5kZXggPSAtMTtcclxuICAgIGxpc3Quc29tZShmdW5jdGlvbihhcHQsIGkpIHtcclxuICAgICAgICBpZiAoYXB0LmlkKCkgPT09IGlkKSB7XHJcbiAgICAgICAgICAgIGZvdW5kID0gYXB0O1xyXG4gICAgICAgICAgICBpbmRleCA9IGk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBpdGVtOiBmb3VuZCxcclxuICAgICAgICBpbmRleDogaW5kZXhcclxuICAgIH07XHJcbn1cclxuXHJcbnZhciBDYWxlbmRhckV2ZW50ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0NhbGVuZGFyRXZlbnQnKSxcclxuICAgIEJvb2tpbmcgPSByZXF1aXJlKCcuLi9tb2RlbHMvQm9va2luZycpO1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKGFwcCkge1xyXG4gICAgLypqc2hpbnQgbWF4c3RhdGVtZW50czogMzAgKi9cclxuXHJcbiAgICB0aGlzLmFwcG9pbnRtZW50cyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcbiAgICB0aGlzLmN1cnJlbnREYXRlID0ga28ub2JzZXJ2YWJsZShuZXcgRGF0ZSgpKTtcclxuICAgIHRoaXMuY3VycmVudElEID0ga28ub2JzZXJ2YWJsZSgwKTtcclxuICAgIHRoaXMuY3VycmVudEluZGV4ID0ga28ub2JzZXJ2YWJsZSgwKTtcclxuICAgIHRoaXMuZWRpdE1vZGUgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuICAgIHRoaXMuaXNMb2FkaW5nID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcbiAgICB0aGlzLmlzU2F2aW5nID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcbiAgICB0aGlzLmVkaXRlZFZlcnNpb24gPSBrby5vYnNlcnZhYmxlKG51bGwpO1xyXG4gICAgdGhpcy5lZGl0ZWRBcHBvaW50bWVudCA9IGtvLm9ic2VydmFibGUobmV3IEFwcG9pbnRtZW50KCkpO1xyXG5cclxuICAgIHZhciBsb2FkaW5nQXBwb2ludG1lbnQgPSBuZXcgQXBwb2ludG1lbnQoe1xyXG4gICAgICAgIGlkOiAwLFxyXG4gICAgICAgIHN1bW1hcnk6ICdMb2FkaW5nLi4uJ1xyXG4gICAgfSk7XHJcbiAgICB2YXIgbmV3RW1wdHlEYXRlQXBwb2ludG1lbnQgPSBmdW5jdGlvbiBuZXdFbXB0eURhdGVBcHBvaW50bWVudCgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IEFwcG9pbnRtZW50KHtcclxuICAgICAgICAgICAgaWQ6IC0xLFxyXG4gICAgICAgICAgICBzdW1tYXJ5OiAnVGhlcmUgYXJlIG5vIGFwcG9pbnRtZW50cyBvbiB0aGlzIGRhdGUnLFxyXG4gICAgICAgICAgICBzdGFydFRpbWU6IHRoaXMuY3VycmVudERhdGUoKSxcclxuICAgICAgICAgICAgZW5kVGltZTogbW9tZW50KHRoaXMuY3VycmVudERhdGUoKSkuYWRkKDEsICdkYXlzJykudG9EYXRlKClcclxuICAgICAgICB9KTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuICAgIHZhciBuZXdGcmVlQXBwb2ludG1lbnQgPSBmdW5jdGlvbiBuZXdGcmVlQXBwb2ludG1lbnQoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBBcHBvaW50bWVudCh7XHJcbiAgICAgICAgICAgIGlkOiAtMixcclxuICAgICAgICAgICAgc3VtbWFyeTogJ0ZyZWUnLFxyXG4gICAgICAgICAgICBzdGFydFRpbWU6IHRoaXMuY3VycmVudERhdGUoKSxcclxuICAgICAgICAgICAgZW5kVGltZTogbW9tZW50KHRoaXMuY3VycmVudERhdGUoKSkuYWRkKDEsICdkYXlzJykudG9EYXRlKClcclxuICAgICAgICB9KTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuICAgIHZhciBuZXdFdmVudEFwcG9pbnRtZW50ID0gZnVuY3Rpb24gbmV3RXZlbnRBcHBvaW50bWVudCgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IEFwcG9pbnRtZW50KHtcclxuICAgICAgICAgICAgaWQ6IC0zLFxyXG4gICAgICAgICAgICBzdW1tYXJ5OiAnTmV3IGV2ZW50Li4uJyxcclxuICAgICAgICAgICAgc291cmNlRXZlbnQ6IG5ldyBDYWxlbmRhckV2ZW50KClcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICB2YXIgbmV3Qm9va2luZ0FwcG9pbnRtZW50ID0gZnVuY3Rpb24gbmV3Qm9va2luZ0FwcG9pbnRtZW50KCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgQXBwb2ludG1lbnQoe1xyXG4gICAgICAgICAgICBpZDogLTQsXHJcbiAgICAgICAgICAgIHN1bW1hcnk6ICdOZXcgYm9va2luZy4uLicsXHJcbiAgICAgICAgICAgIHNvdXJjZUV2ZW50OiBuZXcgQ2FsZW5kYXJFdmVudCgpLFxyXG4gICAgICAgICAgICBzb3VyY2VCb29raW5nOiBuZXcgQm9va2luZygpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNOZXcgPSBrby5jb21wdXRlZChmdW5jdGlvbigpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRJRCgpID09PSAtMyB8fCB0aGlzLmN1cnJlbnRJRCgpID09PSAtNDtcclxuICAgIH0sIHRoaXMpO1xyXG5cclxuICAgIHRoaXMuY3VycmVudEFwcG9pbnRtZW50ID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgLypqc2hpbnQgbWF4Y29tcGxleGl0eTogMTAqL1xyXG5cclxuICAgICAgICB2YXIgaWQgPSB0aGlzLmN1cnJlbnRJRCgpLFxyXG4gICAgICAgICAgICAvLyBJbXBvcnRhbnQsIHVzZWQgaW4gdGhlIHNlYXJjaCBidXQgdG9vIHJlcXVpcmVkXHJcbiAgICAgICAgICAgIC8vIHRvIGJlIGEgZGVwZW5kZW5jeSB3aGVuIHRoZSBsaXN0IGNoYW5nZXMgKHRvIHVwZGF0ZVxyXG4gICAgICAgICAgICAvLyBmcm9tIHRoZSAnbG9hZGluZ0FwcG9pbnRtZW50Jyk6XHJcbiAgICAgICAgICAgIGFwdHMgPSB0aGlzLmFwcG9pbnRtZW50cygpO1xyXG5cclxuICAgICAgICBzd2l0Y2ggKGlkKSB7XHJcbiAgICAgICAgICAgIGNhc2UgLTE6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3RW1wdHlEYXRlQXBwb2ludG1lbnQoKTtcclxuICAgICAgICAgICAgY2FzZSAtMjpcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXdGcmVlQXBwb2ludG1lbnQoKTtcclxuICAgICAgICAgICAgY2FzZSAtMzpcclxuICAgICAgICAgICAgICAgIHRoaXMuZWRpdE1vZGUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3RXZlbnRBcHBvaW50bWVudCgpO1xyXG4gICAgICAgICAgICBjYXNlIC00OlxyXG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0TW9kZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXdCb29raW5nQXBwb2ludG1lbnQoKTtcclxuICAgICAgICAgICAgY2FzZSAtNTpcclxuICAgICAgICAgICAgICAgIHJldHVybiBsb2FkaW5nQXBwb2ludG1lbnQ7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAvLyBQb3NpdGl2ZSBJRDogc2V0IGEgdGVtcG9yYXJ5L2xvYWRpbmcgYXB0XHJcbiAgICAgICAgICAgICAgICAvLyBhbmQgc2VhcmNoIGZvciB0aGUgSURcclxuICAgICAgICAgICAgICAgIGlmIChpZCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBUcmlnZ2VyIGlubWVkaWF0ZSBzZWFyY2ggaWYgbm90IGluIGxvYWRpbmdcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaXNMb2FkaW5nKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2VhcmNoIGluIGxpc3QgYW5kIHNldCBpbmRleFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZm91bmQgPSBmaW5kQXBwb2ludG1lbnRJbkxpc3QoYXB0cywgaWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleChmb3VuZC5pbmRleCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZC5pdGVtO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbG9hZGluZ0FwcG9pbnRtZW50O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gMCBvciBhbnkgb3RoZXIgdmFsdWU6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gbG9vayBmaXJzdCBpbiBsaXN0XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuYXBwb2ludG1lbnRzKCkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVtcHR5IGRhdGUgLT4gLTFcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50SUQoLTEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LmJpbmQodGhpcyksIDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCgtMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXdFbXB0eURhdGVBcHBvaW50bWVudCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50SUQodGhpcy5hcHBvaW50bWVudHMoKVswXS5pZCgpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEluZGV4KDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LmJpbmQodGhpcyksIDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXYWl0aW5nIGZvciBsb2FkOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbG9hZGluZ0FwcG9pbnRtZW50O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LCB0aGlzKVxyXG4gICAgLy8gQXZvaWRpbmcgbXVsdGlwbGUgZXZhbHVhdGlvbnMgYmVjYXVzZSBvZiBjb25zZWN1dGl2ZSB1cGRhdGVzIG9uIHRoZSBvYnNlcnZhYmxlc1xyXG4gICAgLmV4dGVuZCh7IHJhdGVMaW1pdDogMCB9KTtcclxuXHJcbiAgICB0aGlzLmdvUHJldmlvdXMgPSBmdW5jdGlvbiBnb1ByZXZpb3VzKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmVkaXRNb2RlKCkpIHJldHVybjtcclxuXHJcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5jdXJyZW50SW5kZXgoKSAtIDE7XHJcblxyXG4gICAgICAgIGlmIChpbmRleCA8IDApIHtcclxuICAgICAgICAgICAgLy8gR28gcHJldmlvdXMgZGF0ZVxyXG4gICAgICAgICAgICAvLyBGaXJzdCBjaGFuZ2UgSUQgdG8gYmUgJ2xvYWRpbmcnIHRvIHNob3cgc3RhdGUgYW5kIFxyXG4gICAgICAgICAgICAvLyBhbGxvdyBmb3IgYXV0byBsb29rLXVwIG9uIGxvYWRpbmcgZmluaXNoLlxyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRJRCgtNSk7XHJcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBwcmV2aW91cyBkYXRlXHJcbiAgICAgICAgICAgIHZhciBtID0gbW9tZW50KHRoaXMuY3VycmVudERhdGUoKSk7XHJcbiAgICAgICAgICAgIGlmIChtLmlzVmFsaWQoKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50RGF0ZShtLnN1YnRyYWN0KDEsICdkYXlzJykudG9EYXRlKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gRXJyb3IgZmFsbGJhY2sgdG8gdG9kYXlcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudERhdGUoZ2V0RGF0ZVdpdGhvdXRUaW1lKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBHbyBwcmV2aW91cyBpdGVtIGluIHRoZSBsaXN0LCBieSBjaGFuZ2luZyBjdXJyZW50SURcclxuICAgICAgICAgICAgdmFyIGFwdCA9IHRoaXMuYXBwb2ludG1lbnRzKClbaW5kZXggJSB0aGlzLmFwcG9pbnRtZW50cygpLmxlbmd0aF07XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudElEKGFwdC5pZCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ29OZXh0ID0gZnVuY3Rpb24gZ29OZXh0KCkge1xyXG4gICAgICAgIGlmICh0aGlzLmVkaXRNb2RlKCkpIHJldHVybjtcclxuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmN1cnJlbnRJbmRleCgpICsgMTtcclxuXHJcbiAgICAgICAgaWYgKGluZGV4ID49IHRoaXMuYXBwb2ludG1lbnRzKCkubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIC8vIEdvIG5leHQgZGF0ZVxyXG4gICAgICAgICAgICAvLyBGaXJzdCBjaGFuZ2UgSUQgdG8gYmUgJ2xvYWRpbmcnIHRvIHNob3cgc3RhdGUgYW5kIFxyXG4gICAgICAgICAgICAvLyBhbGxvdyBmb3IgYXV0byBsb29rLXVwIG9uIGxvYWRpbmcgZmluaXNoLlxyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRJRCgtNSk7XHJcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBuZXh0IGRhdGVcclxuICAgICAgICAgICAgdmFyIG0gPSBtb21lbnQodGhpcy5jdXJyZW50RGF0ZSgpKTtcclxuICAgICAgICAgICAgaWYgKG0uaXNWYWxpZCgpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnREYXRlKG0uYWRkKDEsICdkYXlzJykudG9EYXRlKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gRXJyb3IgZmFsbGJhY2sgdG8gdG9kYXlcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudERhdGUoZ2V0RGF0ZVdpdGhvdXRUaW1lKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBHbyBuZXh0IGl0ZW0gaW4gdGhlIGxpc3QsIGJ5IGNoYW5naW5nIGN1cnJlbnRJRFxyXG4gICAgICAgICAgICB2YXIgYXB0ID0gdGhpcy5hcHBvaW50bWVudHMoKVtpbmRleCAlIHRoaXMuYXBwb2ludG1lbnRzKCkubGVuZ3RoXTtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50SUQoYXB0LmlkKCkpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5lZGl0ID0gZnVuY3Rpb24gZWRpdCgpIHtcclxuICAgICAgICAvLyBBIHN1YnNjcmliZWQgaGFuZGxlciBlbnN1cmUgdG8gZG8gdGhlIG5lZWRlZCB0YXNrc1xyXG4gICAgICAgIHRoaXMuZWRpdE1vZGUodHJ1ZSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICAgICAgLy8gQSBzdWJzY3JpYmVkIGhhbmRsZXIgZW5zdXJlIHRvIGRvIHRoZSBuZWVkZWQgdGFza3NcclxuICAgICAgICB0aGlzLmVkaXRNb2RlKGZhbHNlKTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLmNhbmNlbCA9IGZ1bmN0aW9uIGNhbmNlbCgpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuZWRpdGVkVmVyc2lvbigpKSB7XHJcbiAgICAgICAgICAgIC8vIERpc2NhcmQgcHJldmlvdXMgdmVyc2lvblxyXG4gICAgICAgICAgICB0aGlzLmVkaXRlZFZlcnNpb24oKS5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIE91dCBvZiBlZGl0IG1vZGVcclxuICAgICAgICB0aGlzLmVkaXRNb2RlKGZhbHNlKTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuXHJcbiAgICAvKipcclxuICAgICAgICBFeHRlcm5hbCBhY3Rpb25zXHJcbiAgICAqKi9cclxuICAgIHZhciBlZGl0RmllbGRPbiA9IGZ1bmN0aW9uIGVkaXRGaWVsZE9uKGFjdGl2aXR5LCBkYXRhKSB7XHJcblxyXG4gICAgICAgIC8vIEluY2x1ZGUgYXBwb2ludG1lbnQgdG8gcmVjb3ZlciBzdGF0ZSBvbiByZXR1cm46XHJcbiAgICAgICAgZGF0YS5hcHBvaW50bWVudCA9IHRoaXMuY3VycmVudEFwcG9pbnRtZW50KCkubW9kZWwudG9QbGFpbk9iamVjdCh0cnVlKTtcclxuXHJcbiAgICAgICAgYXBwLnNoZWxsLmdvKGFjdGl2aXR5LCBkYXRhKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5waWNrRGF0ZVRpbWUgPSBmdW5jdGlvbiBwaWNrRGF0ZVRpbWUoKSB7XHJcblxyXG4gICAgICAgIGVkaXRGaWVsZE9uKCdkYXRldGltZVBpY2tlcicsIHtcclxuICAgICAgICAgICAgc2VsZWN0ZWREYXRldGltZTogbnVsbFxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnBpY2tDbGllbnQgPSBmdW5jdGlvbiBwaWNrQ2xpZW50KCkge1xyXG5cclxuICAgICAgICBlZGl0RmllbGRPbignY2xpZW50cycsIHtcclxuICAgICAgICAgICAgc2VsZWN0Q2xpZW50OiB0cnVlLFxyXG4gICAgICAgICAgICBzZWxlY3RlZENsaWVudDogbnVsbFxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnBpY2tTZXJ2aWNlID0gZnVuY3Rpb24gcGlja1NlcnZpY2UoKSB7XHJcblxyXG4gICAgICAgIGVkaXRGaWVsZE9uKCdzZXJ2aWNlcycsIHtcclxuICAgICAgICAgICAgc2VsZWN0U2VydmljZXM6IHRydWUsXHJcbiAgICAgICAgICAgIHNlbGVjdGVkU2VydmljZXM6IHRoaXMuY3VycmVudEFwcG9pbnRtZW50KCkuc2VydmljZXMoKVxyXG4gICAgICAgIH0pO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG5cclxuICAgIHRoaXMuY2hhbmdlUHJpY2UgPSBmdW5jdGlvbiBjaGFuZ2VQcmljZSgpIHtcclxuICAgICAgICAvLyBUT0RPXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMucGlja0xvY2F0aW9uID0gZnVuY3Rpb24gcGlja0xvY2F0aW9uKCkge1xyXG5cclxuICAgICAgICBlZGl0RmllbGRPbignbG9jYXRpb25zJywge1xyXG4gICAgICAgICAgICBzZWxlY3RMb2NhdGlvbjogdHJ1ZSxcclxuICAgICAgICAgICAgc2VsZWN0ZWRMb2NhdGlvbjogdGhpcy5jdXJyZW50QXBwb2ludG1lbnQoKS5sb2NhdGlvbigpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcblxyXG4gICAgdmFyIHRleHRGaWVsZHNIZWFkZXJzID0ge1xyXG4gICAgICAgIHByZU5vdGVzVG9DbGllbnQ6ICdOb3RlcyB0byBjbGllbnQnLFxyXG4gICAgICAgIHBvc3ROb3Rlc1RvQ2xpZW50OiAnTm90ZXMgdG8gY2xpZW50IChhZnRlcndhcmRzKScsXHJcbiAgICAgICAgcHJlTm90ZXNUb1NlbGY6ICdOb3RlcyB0byBzZWxmJyxcclxuICAgICAgICBwb3N0Tm90ZXNUb1NlbGY6ICdCb29raW5nIHN1bW1hcnknXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZWRpdFRleHRGaWVsZCA9IGZ1bmN0aW9uIGVkaXRUZXh0RmllbGQoZmllbGQpIHtcclxuXHJcbiAgICAgICAgZWRpdEZpZWxkT24oJ3RleHRFZGl0b3InLCB7XHJcbiAgICAgICAgICAgIHJlcXVlc3Q6ICd0ZXh0RWRpdG9yJyxcclxuICAgICAgICAgICAgZmllbGQ6IGZpZWxkLFxyXG4gICAgICAgICAgICB0aXRsZTogdGhpcy5pc05ldygpID8gJ05ldyBib29raW5nJyA6ICdCb29raW5nJyxcclxuICAgICAgICAgICAgaGVhZGVyOiB0ZXh0RmllbGRzSGVhZGVyc1tmaWVsZF0sXHJcbiAgICAgICAgICAgIHRleHQ6IHRoaXMuY3VycmVudEFwcG9pbnRtZW50KClbZmllbGRdKClcclxuICAgICAgICB9KTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxufVxyXG4iLCIvKipcclxuICAgIEJvb2tNZUJ1dHRvbiBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEJvb2tNZUJ1dHRvbkFjdGl2aXR5KCkge1xyXG4gICAgXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkZyZWVsYW5jZXI7XHJcblxyXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdTY2hlZHVsaW5nJyk7XHJcbiAgICBcclxuICAgIC8vIEF1dG8gc2VsZWN0IHRleHQgb24gdGV4dGFyZWEsIGZvciBiZXR0ZXIgJ2NvcHknXHJcbiAgICAvLyBOT1RFOiB0aGUgJ3NlbGVjdCcgbXVzdCBoYXBwZW4gb24gY2xpY2ssIG5vdCB0YXAsIG5vdCBmb2N1cyxcclxuICAgIC8vIG9ubHkgJ2NsaWNrJyBpcyByZWxpYWJsZSBhbmQgYnVnLWZyZWUuXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLiRhY3Rpdml0eSxcclxuICAgICAgICBldmVudDogJ2NsaWNrJyxcclxuICAgICAgICBzZWxlY3RvcjogJ3RleHRhcmVhJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgJCh0aGlzKS5zZWxlY3QoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy5hcHAubW9kZWwubWFya2V0cGxhY2VQcm9maWxlLFxyXG4gICAgICAgIGV2ZW50OiAnZXJyb3InLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICBpZiAoZXJyICYmIGVyci50YXNrID09PSAnc2F2ZScpIHJldHVybjtcclxuICAgICAgICAgICAgdmFyIG1zZyA9ICdFcnJvciBsb2FkaW5nIGRhdGEgdG8gYnVpbGQgdGhlIEJ1dHRvbi4nO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5tb2RhbHMuc2hvd0Vycm9yKHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBtc2csXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyICYmIGVyci50YXNrICYmIGVyci5lcnJvciB8fCBlcnJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhzdGF0ZSkge1xyXG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBzdGF0ZSk7XHJcbiAgICBcclxuICAgIC8vIEtlZXAgZGF0YSB1cGRhdGVkOlxyXG4gICAgdGhpcy5hcHAubW9kZWwubWFya2V0cGxhY2VQcm9maWxlLnN5bmMoKTtcclxuICAgIFxyXG4gICAgLy8gU2V0IHRoZSBqb2IgdGl0bGVcclxuICAgIHZhciBqb2JJRCA9IHN0YXRlLnJvdXRlLnNlZ21lbnRzWzBdIHwwO1xyXG4gICAgdGhpcy52aWV3TW9kZWwuam9iVGl0bGVJRChqb2JJRCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoYXBwKSB7XHJcblxyXG4gICAgdmFyIG1hcmtldHBsYWNlUHJvZmlsZSA9IGFwcC5tb2RlbC5tYXJrZXRwbGFjZVByb2ZpbGU7XHJcbiAgICBcclxuICAgIC8vIEFjdHVhbCBkYXRhIGZvciB0aGUgZm9ybTpcclxuICAgIFxyXG4gICAgLy8gUmVhZC1vbmx5IGJvb2tDb2RlXHJcbiAgICB0aGlzLmJvb2tDb2RlID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIG1hcmtldHBsYWNlUHJvZmlsZS5kYXRhLmJvb2tDb2RlKCk7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgdGhpcy5qb2JUaXRsZUlEID0ga28ub2JzZXJ2YWJsZSgwKTtcclxuICAgIFxyXG4gICAgLy8gQnV0dG9uIHR5cGUsIGNhbiBiZTogJ3NtYWxsJywgJ21lZGl1bScsICdsYXJnZScsICdsaW5rJ1xyXG4gICAgdGhpcy50eXBlID0ga28ub2JzZXJ2YWJsZSgnbWVkaXVtJyk7XHJcblxyXG4gICAgdGhpcy5pc0xvY2tlZCA9IG1hcmtldHBsYWNlUHJvZmlsZS5pc0xvY2tlZDtcclxuICAgIFxyXG4gICAgLy8gR2VuZXJhdGlvbiBvZiB0aGUgYnV0dG9uIGNvZGVcclxuICAgIFxyXG4gICAgdmFyIGJ1dHRvblRlbXBsYXRlID1cclxuICAgICAgICAnPCEtLSBiZWdpbiBMb2Nvbm9taWNzIGJvb2stbWUtYnV0dG9uIC0tPicgK1xyXG4gICAgICAgICc8YSBzdHlsZT1cImRpc3BsYXk6aW5saW5lLWJsb2NrXCI+PGltZyBhbHQ9XCJcIiBzdHlsZT1cImJvcmRlcjpub25lXCIgLz48L2E+JyArIFxyXG4gICAgICAgICc8IS0tIGVuZCBMb2Nvbm9taWNzIGJvb2stbWUtYnV0dG9uIC0tPic7XHJcbiAgICBcclxuICAgIHZhciBsaW5rVGVtcGxhdGUgPVxyXG4gICAgICAgICc8IS0tIGJlZ2luIExvY29ub21pY3MgYm9vay1tZS1idXR0b24gLS0+JyArXHJcbiAgICAgICAgJzxhPjxzcGFuPjwvc3Bhbj48L2E+JyArXHJcbiAgICAgICAgJzwhLS0gZW5kIExvY29ub21pY3MgYm9vay1tZS1idXR0b24gLS0+JztcclxuXHJcbiAgICB0aGlzLmJ1dHRvbkh0bWxDb2RlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChtYXJrZXRwbGFjZVByb2ZpbGUuaXNMb2FkaW5nKCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdsb2FkaW5nLi4uJztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciB0eXBlID0gdGhpcy50eXBlKCksXHJcbiAgICAgICAgICAgICAgICB0cGwgPSBidXR0b25UZW1wbGF0ZTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlID09PSAnbGluaycpXHJcbiAgICAgICAgICAgICAgICB0cGwgPSBsaW5rVGVtcGxhdGU7XHJcblxyXG4gICAgICAgICAgICB2YXIgc2l0ZVVybCA9ICQoJ2h0bWwnKS5hdHRyKCdkYXRhLXNpdGUtdXJsJyksXHJcbiAgICAgICAgICAgICAgICBsaW5rVXJsID0gc2l0ZVVybCArICcvYm9vay8nICsgdGhpcy5ib29rQ29kZSgpICsgJy8nICsgdGhpcy5qb2JUaXRsZUlEKCkgKyAnLycsXHJcbiAgICAgICAgICAgICAgICBpbWdVcmwgPSBzaXRlVXJsICsgJy9pbWcvZXh0ZXJuL2Jvb2stbWUtYnV0dG9uLScgKyB0eXBlICsgJy5wbmcnO1xyXG5cclxuICAgICAgICAgICAgdmFyIGNvZGUgPSBnZW5lcmF0ZUJ1dHRvbkNvZGUoe1xyXG4gICAgICAgICAgICAgICAgdHBsOiB0cGwsXHJcbiAgICAgICAgICAgICAgICBsYWJlbDogJ0NsaWNrIGhlcmUgdG8gYm9vayBtZSBub3cgKG9uIGxvY29ub21pY3MuY29tKScsXHJcbiAgICAgICAgICAgICAgICBsaW5rVXJsOiBsaW5rVXJsLFxyXG4gICAgICAgICAgICAgICAgaW1nVXJsOiBpbWdVcmxcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gY29kZTtcclxuICAgICAgICB9XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgLy8gVE9ETyBDb3B5IGZlYXR1cmU7IHdpbGwgbmVlZCBhIG5hdGl2ZSBwbHVnaW5cclxuICAgIHRoaXMuY29weUNvZGUgPSBmdW5jdGlvbigpIHsgfTtcclxuICAgIFxyXG4gICAgdGhpcy5zZW5kQnlFbWFpbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIFRPRE8gU2VuZCBieSBlbWFpbCwgd2l0aCB3aW5kb3cub3BlbignbWFpbHRvOiZib2R5PWNvZGUnKTtcclxuICAgIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdlbmVyYXRlQnV0dG9uQ29kZShvcHRpb25zKSB7XHJcblxyXG4gICAgdmFyICRidG4gPSAkKCQucGFyc2VIVE1MKCc8ZGl2PicgKyBvcHRpb25zLnRwbCArICc8L2Rpdj4nKSk7XHJcblxyXG4gICAgJGJ0blxyXG4gICAgLmZpbmQoJ2EnKVxyXG4gICAgLmF0dHIoJ2hyZWYnLCBvcHRpb25zLmxpbmtVcmwpXHJcbiAgICAuZmluZCgnc3BhbicpXHJcbiAgICAudGV4dChvcHRpb25zLmxhYmVsKTtcclxuICAgICRidG5cclxuICAgIC5maW5kKCdpbWcnKVxyXG4gICAgLmF0dHIoJ3NyYycsIG9wdGlvbnMuaW1nVXJsKVxyXG4gICAgLmF0dHIoJ2FsdCcsIG9wdGlvbnMubGFiZWwpO1xyXG5cclxuICAgIHJldHVybiAkYnRuLmh0bWwoKTtcclxufVxyXG4iLCIvKipcclxuICAgIGJvb2tpbmdDb25maXJtYXRpb24gYWN0aXZpdHlcclxuICAgIFxyXG4gICAgVE9ETzogVG8gcmVwbGFjZWQgYnkgYSBtb2RhbFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxuICAgIFxyXG52YXIgc2luZ2xldG9uID0gbnVsbDtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRDbGllbnRzKCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcclxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgQm9va2luZ0NvbmZpcm1hdGlvbkFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIEJvb2tpbmdDb25maXJtYXRpb25BY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcclxuICAgIFxyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuXHJcbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xyXG4gICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLmRhdGFWaWV3LCAkYWN0aXZpdHkuZ2V0KDApKTtcclxufVxyXG5cclxuQm9va2luZ0NvbmZpcm1hdGlvbkFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5ib29raW5nKVxyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuYm9va2luZyhvcHRpb25zLmJvb2tpbmcpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIC8vIDpBcHBvaW50bWVudFxyXG4gICAgdGhpcy5ib29raW5nID0ga28ub2JzZXJ2YWJsZShudWxsKTtcclxufVxyXG4iLCIvKiogQ2FsZW5kYXIgYWN0aXZpdHkgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxuICAgIC8vQ2FsZW5kYXJTbG90ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0NhbGVuZGFyU2xvdCcpO1xyXG5cclxucmVxdWlyZSgnLi4vY29tcG9uZW50cy9EYXRlUGlja2VyJyk7XHJcblxyXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XHJcblxyXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQ2FsZW5kYXJBY3Rpdml0eSgpIHtcclxuICAgIFxyXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcclxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIoJ0NhbGVuZGFyJyk7XHJcblxyXG4gICAgLyogR2V0dGluZyBlbGVtZW50cyAqL1xyXG4gICAgdGhpcy4kZGF0ZXBpY2tlciA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNjYWxlbmRhckRhdGVQaWNrZXInKTtcclxuICAgIHRoaXMuJGRhaWx5VmlldyA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNjYWxlbmRhckRhaWx5VmlldycpO1xyXG4gICAgdGhpcy4kZGF0ZUhlYWRlciA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNjYWxlbmRhckRhdGVIZWFkZXInKTtcclxuICAgIHRoaXMuJGRhdGVUaXRsZSA9IHRoaXMuJGRhdGVIZWFkZXIuY2hpbGRyZW4oJy5DYWxlbmRhckRhdGVIZWFkZXItZGF0ZScpO1xyXG4gICAgdGhpcy4kY2hvb3NlTmV3ID0gJCgnI2NhbGVuZGFyQ2hvb3NlTmV3Jyk7XHJcbiAgICBcclxuICAgIC8qIEluaXQgY29tcG9uZW50cyAqL1xyXG4gICAgdGhpcy4kZGF0ZXBpY2tlci5zaG93KCkuZGF0ZXBpY2tlcigpO1xyXG4gICAgXHJcbiAgICAvKiBFdmVudCBoYW5kbGVycyAqL1xyXG4gICAgLy8gQ2hhbmdlcyBvbiBjdXJyZW50RGF0ZVxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwuY3VycmVudERhdGUsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oZGF0ZSkge1xyXG4gICAgICAgICAgICAvLyBUcmlnZ2VyIGEgbGF5b3V0IHVwZGF0ZSwgcmVxdWlyZWQgYnkgdGhlIGZ1bGwtaGVpZ2h0IGZlYXR1cmVcclxuICAgICAgICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ2xheW91dFVwZGF0ZScpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRhdGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBtZGF0ZSA9IG1vbWVudChkYXRlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobWRhdGUuaXNWYWxpZCgpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpc29EYXRlID0gbWRhdGUudG9JU09TdHJpbmcoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIGRhdGVwaWNrZXIgc2VsZWN0ZWQgZGF0ZSBvbiBkYXRlIGNoYW5nZSAoZnJvbSBcclxuICAgICAgICAgICAgICAgICAgICAvLyBhIGRpZmZlcmVudCBzb3VyY2UgdGhhbiB0aGUgZGF0ZXBpY2tlciBpdHNlbGZcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLiRkYXRlcGlja2VyLnJlbW92ZUNsYXNzKCdpcy12aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hhbmdlIG5vdCBmcm9tIHRoZSB3aWRnZXQ/XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuJGRhdGVwaWNrZXIuZGF0ZXBpY2tlcignZ2V0VmFsdWUnKS50b0lTT1N0cmluZygpICE9PSBpc29EYXRlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLiRkYXRlcGlja2VyLmRhdGVwaWNrZXIoJ3NldFZhbHVlJywgZGF0ZSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIE9uIGN1cnJlbnREYXRlIGNoYW5nZXMsIHVwZGF0ZSB0aGUgVVJMXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogc2F2ZSBhIHVzZWZ1bCBzdGF0ZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIERPVUJUOiBwdXNoIG9yIHJlcGxhY2Ugc3RhdGU/IChtb3JlIGhpc3RvcnkgZW50cmllcyBvciB0aGUgc2FtZT8pXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuaGlzdG9yeS5wdXNoU3RhdGUobnVsbCwgbnVsbCwgJ2NhbGVuZGFyLycgKyBpc29EYXRlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRE9ORVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gU29tZXRoaW5nIGZhaWwsIGJhZCBkYXRlIG9yIG5vdCBkYXRlIGF0IGFsbFxyXG4gICAgICAgICAgICAvLyBTZXQgdGhlIGN1cnJlbnQgXHJcbiAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmN1cnJlbnREYXRlKGdldERhdGVXaXRob3V0VGltZSgpKTtcclxuXHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTd2lwZSBkYXRlIG9uIGdlc3R1cmVcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMuJGRhaWx5VmlldyxcclxuICAgICAgICBldmVudDogJ3N3aXBlbGVmdCBzd2lwZXJpZ2h0JyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBkaXIgPSBlLnR5cGUgPT09ICdzd2lwZWxlZnQnID8gJ25leHQnIDogJ3ByZXYnO1xyXG5cclxuICAgICAgICAgICAgLy8gSGFjayB0byBzb2x2ZSB0aGUgZnJlZXp5LXN3aXBlIGFuZCB0YXAtYWZ0ZXIgYnVnIG9uIEpRTTpcclxuICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcigndG91Y2hlbmQnKTtcclxuICAgICAgICAgICAgLy8gQ2hhbmdlIGRhdGVcclxuICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCBkaXIsICdkYXRlJyk7XHJcblxyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ2hhbmdpbmcgZGF0ZSB3aXRoIGJ1dHRvbnM6XHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLiRkYXRlSGVhZGVyLFxyXG4gICAgICAgIGV2ZW50OiAndGFwJyxcclxuICAgICAgICBzZWxlY3RvcjogJy5DYWxlbmRhckRhdGVIZWFkZXItc3dpdGNoJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoZS5jdXJyZW50VGFyZ2V0LmdldEF0dHJpYnV0ZSgnaHJlZicpKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICcjcHJldic6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCAncHJldicsICdkYXRlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICcjbmV4dCc6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCAnbmV4dCcsICdkYXRlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIExldHMgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU2hvd2luZyBkYXRlcGlja2VyIHdoZW4gcHJlc3NpbmcgdGhlIHRpdGxlXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLiRkYXRlVGl0bGUsXHJcbiAgICAgICAgZXZlbnQ6ICd0YXAnLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci50b2dnbGVDbGFzcygnaXMtdmlzaWJsZScpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBVcGRhdGluZyB2aWV3IGRhdGUgd2hlbiBwaWNrZWQgYW5vdGhlciBvbmVcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMuJGRhdGVwaWNrZXIsXHJcbiAgICAgICAgZXZlbnQ6ICdjaGFuZ2VEYXRlJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgIGlmIChlLnZpZXdNb2RlID09PSAnZGF5cycpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmN1cnJlbnREYXRlKGdldERhdGVXaXRob3V0VGltZShlLmRhdGUpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU2V0IGRhdGUgdG8gdG9kYXlcclxuICAgIHRoaXMudmlld01vZGVsLmN1cnJlbnREYXRlKGdldERhdGVXaXRob3V0VGltZSgpKTtcclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIG9wdGlvbnMpO1xyXG5cclxuICAgIC8vIERhdGUgZnJvbSB0aGUgcGFyYW1ldGVyLCBmYWxsYmFjayB0byB0b2RheVxyXG4gICAgdmFyIHNkYXRlID0gb3B0aW9ucy5yb3V0ZSAmJiBvcHRpb25zLnJvdXRlLnNlZ21lbnRzICYmIG9wdGlvbnMucm91dGUuc2VnbWVudHNbMF0sXHJcbiAgICAgICAgZGF0ZTtcclxuICAgIGlmIChzZGF0ZSkge1xyXG4gICAgICAgIC8vIFBhcnNpbmcgZGF0ZSBmcm9tIElTTyBmb3JtYXRcclxuICAgICAgICB2YXIgbWRhdGUgPSBtb21lbnQoc2RhdGUpO1xyXG4gICAgICAgIC8vIENoZWNrIGlzIHZhbGlkLCBhbmQgZW5zdXJlIGlzIGRhdGUgYXQgMTJBTVxyXG4gICAgICAgIGRhdGUgPSBtZGF0ZS5pc1ZhbGlkKCkgPyBnZXREYXRlV2l0aG91dFRpbWUobWRhdGUudG9EYXRlKCkpIDogbnVsbDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgaWYgKCFkYXRlKVxyXG4gICAgICAgIC8vIFRvZGF5OlxyXG4gICAgICAgIGRhdGUgPSBnZXREYXRlV2l0aG91dFRpbWUoKTtcclxuICAgIFxyXG4gICAgdGhpcy52aWV3TW9kZWwuY3VycmVudERhdGUoZGF0ZSk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBnZXREYXRlV2l0aG91dFRpbWUoZGF0ZSkge1xyXG4gICAgZGF0ZSA9IGRhdGUgfHwgbmV3IERhdGUoKTtcclxuICAgIHJldHVybiBuZXcgRGF0ZShcclxuICAgICAgICBkYXRlLmdldEZ1bGxZZWFyKCksXHJcbiAgICAgICAgZGF0ZS5nZXRNb250aCgpLFxyXG4gICAgICAgIGRhdGUuZ2V0RGF0ZSgpLFxyXG4gICAgICAgIDAsIDAsIDBcclxuICAgICk7XHJcbn1cclxuXHJcbnZhciBBcHBvaW50bWVudCA9IHJlcXVpcmUoJy4uL21vZGVscy9BcHBvaW50bWVudCcpLFxyXG4gICAgVGltZVNsb3RWaWV3TW9kZWwgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL1RpbWVTbG90Jyk7XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoYXBwKSB7XHJcblxyXG4gICAgdGhpcy5jdXJyZW50RGF0ZSA9IGtvLm9ic2VydmFibGUoZ2V0RGF0ZVdpdGhvdXRUaW1lKCkpO1xyXG4gICAgdmFyIGZ1bGxEYXlGcmVlID0gW0FwcG9pbnRtZW50Lm5ld0ZyZWVTbG90KHsgZGF0ZTogdGhpcy5jdXJyZW50RGF0ZSgpIH0pXTtcclxuXHJcbiAgICAvLyBzbG90c1NvdXJjZSBzYXZlIHRoZSBkYXRhIGFzIHByb2Nlc3NlZCBieSBhIHJlcXVlc3Qgb2YgXHJcbiAgICAvLyBkYXRhIGJlY2F1c2UgYSBkYXRlIGNoYW5nZS5cclxuICAgIC8vIEl0J3MgdXBkYXRlZCBieSBjaGFuZ2VzIG9uIGN1cnJlbnREYXRlIHRoYXQgcGVyZm9ybXMgdGhlIHJlbW90ZSBsb2FkaW5nXHJcbiAgICB0aGlzLnNsb3RzU291cmNlID0ga28ub2JzZXJ2YWJsZShmdWxsRGF5RnJlZSk7XHJcbiAgICAvLyBzbG90cyBjb21wdXRlZCwgdXNpbmcgc2xvdHNTb3VyY2UuXHJcbiAgICAvLyBBcyBjb21wdXRlZCBpbiBvcmRlciB0byBhbGxvdyBhbnkgb3RoZXIgb2JzZXJ2YWJsZSBjaGFuZ2VcclxuICAgIC8vIGZyb20gdHJpZ2dlciB0aGUgY3JlYXRpb24gb2YgYSBuZXcgdmFsdWVcclxuICAgIHRoaXMuc2xvdHMgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgIFxyXG4gICAgICAgIHZhciBzbG90cyA9IHRoaXMuc2xvdHNTb3VyY2UoKTtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gYXBwLm1vZGVsLmFwcG9pbnRtZW50c1xyXG4gICAgICAgICAgICAuZmlsbFdpdGhGcmVlU2xvdHMoc2xvdHMpXHJcbiAgICAgICAgICAgIC5tYXAoVGltZVNsb3RWaWV3TW9kZWwuZnJvbUFwcG9pbnRtZW50KTtcclxuXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5pc0xvYWRpbmcgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuXHJcbiAgICAvLyBVcGRhdGUgY3VycmVudCBzbG90cyBvbiBkYXRlIGNoYW5nZVxyXG4gICAgdmFyIHByZXZpb3VzRGF0ZSA9IHRoaXMuY3VycmVudERhdGUoKS50b0lTT1N0cmluZygpO1xyXG4gICAgdGhpcy5jdXJyZW50RGF0ZS5zdWJzY3JpYmUoZnVuY3Rpb24gKGRhdGUpIHtcclxuICAgICAgICBcclxuICAgICAgICAvLyBJTVBPUlRBTlQ6IFRoZSBkYXRlIG9iamVjdCBtYXkgYmUgcmV1c2VkIGFuZCBtdXRhdGVkIGJldHdlZW4gY2FsbHNcclxuICAgICAgICAvLyAobW9zdGx5IGJlY2F1c2UgdGhlIHdpZGdldCBJIHRoaW5rKSwgc28gaXMgYmV0dGVyIHRvIGNyZWF0ZVxyXG4gICAgICAgIC8vIGEgY2xvbmUgYW5kIGF2b2lkIGdldHRpbmcgcmFjZS1jb25kaXRpb25zIGluIHRoZSBkYXRhIGRvd25sb2FkaW5nLlxyXG4gICAgICAgIGRhdGUgPSBuZXcgRGF0ZShEYXRlLnBhcnNlKGRhdGUudG9JU09TdHJpbmcoKSkpO1xyXG5cclxuICAgICAgICAvLyBBdm9pZCBkdXBsaWNhdGVkIG5vdGlmaWNhdGlvbiwgdW4tY2hhbmdlZCBkYXRlXHJcbiAgICAgICAgaWYgKGRhdGUudG9JU09TdHJpbmcoKSA9PT0gcHJldmlvdXNEYXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJldmlvdXNEYXRlID0gZGF0ZS50b0lTT1N0cmluZygpO1xyXG5cclxuICAgICAgICB0aGlzLmlzTG9hZGluZyh0cnVlKTtcclxuICAgICAgICBcclxuICAgICAgICBhcHAubW9kZWwuYXBwb2ludG1lbnRzLmdldEFwcG9pbnRtZW50c0J5RGF0ZShkYXRlKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGFwcG9pbnRtZW50c0xpc3QpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIElNUE9SVEFOVDogRmlyc3QsIHdlIG5lZWQgdG8gY2hlY2sgdGhhdCB3ZSBhcmVcclxuICAgICAgICAgICAgLy8gaW4gdGhlIHNhbWUgZGF0ZSBzdGlsbCwgYmVjYXVzZSBzZXZlcmFsIGxvYWRpbmdzXHJcbiAgICAgICAgICAgIC8vIGNhbiBoYXBwZW4gYXQgYSB0aW1lIChjaGFuZ2luZyBxdWlja2x5IGZyb20gZGF0ZSB0byBkYXRlXHJcbiAgICAgICAgICAgIC8vIHdpdGhvdXQgd2FpdCBmb3IgZmluaXNoKSwgYXZvaWRpbmcgYSByYWNlLWNvbmRpdGlvblxyXG4gICAgICAgICAgICAvLyB0aGF0IGNyZWF0ZSBmbGlja2VyaW5nIGVmZmVjdHMgb3IgcmVwbGFjZSB0aGUgZGF0ZSBldmVudHNcclxuICAgICAgICAgICAgLy8gYnkgdGhlIGV2ZW50cyBmcm9tIG90aGVyIGRhdGUsIGJlY2F1c2UgaXQgdG9va3MgbW9yZSBhbiBjaGFuZ2VkLlxyXG4gICAgICAgICAgICAvLyBUT0RPOiBzdGlsbCB0aGlzIGhhcyB0aGUgbWlub3IgYnVnIG9mIGxvc2luZyB0aGUgaXNMb2FkaW5nXHJcbiAgICAgICAgICAgIC8vIGlmIGEgcHJldmlvdXMgdHJpZ2dlcmVkIGxvYWQgc3RpbGwgZGlkbid0IGZpbmlzaGVkOyBpdHMgbWlub3JcclxuICAgICAgICAgICAgLy8gYmVjYXVzZSBpcyB2ZXJ5IHJhcmUgdGhhdCBoYXBwZW5zLCBtb3ZpbmcgdGhpcyBzdHVmZlxyXG4gICAgICAgICAgICAvLyB0byBhIHNwZWNpYWwgYXBwTW9kZWwgZm9yIG1peGVkIGJvb2tpbmdzIGFuZCBldmVudHMgd2l0aCBcclxuICAgICAgICAgICAgLy8gcGVyIGRhdGUgY2FjaGUgdGhhdCBpbmNsdWRlcyBhIHZpZXcgb2JqZWN0IHdpdGggaXNMb2FkaW5nIHdpbGxcclxuICAgICAgICAgICAgLy8gZml4IGl0IGFuZCByZWR1Y2UgdGhpcyBjb21wbGV4aXR5LlxyXG4gICAgICAgICAgICBpZiAoZGF0ZS50b0lTT1N0cmluZygpICE9PSB0aGlzLmN1cnJlbnREYXRlKCkudG9JU09TdHJpbmcoKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gUmFjZSBjb25kaXRpb24sIG5vdCB0aGUgc2FtZSEhIG91dDpcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoYXBwb2ludG1lbnRzTGlzdCAmJiBhcHBvaW50bWVudHNMaXN0Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VyY2U6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNsb3RzU291cmNlKGFwcG9pbnRtZW50c0xpc3QpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zbG90c1NvdXJjZShmdWxsRGF5RnJlZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzTG9hZGluZyhmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxyXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFNob3cgZnJlZSBvbiBlcnJvclxyXG4gICAgICAgICAgICB0aGlzLnNsb3RzU291cmNlKGZ1bGxEYXlGcmVlKTtcclxuICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIG1zZyA9ICdFcnJvciBsb2FkaW5nIGNhbGVuZGFyIGV2ZW50cy4nO1xyXG4gICAgICAgICAgICBhcHAubW9kYWxzLnNob3dFcnJvcih7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogbXNnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVyciAmJiBlcnIuZXJyb3IgfHwgZXJyXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn1cclxuIiwiLyoqXHJcbiAgICBDYWxlbmRhclN5bmNpbmcgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKSxcclxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxuXHJcbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBDYWxlbmRhclN5bmNpbmdBY3Rpdml0eSgpIHtcclxuICAgIFxyXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIFxyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xyXG5cclxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignU2NoZWR1bGluZycpO1xyXG4gICAgXHJcbiAgICAvLyBBZGRpbmcgYXV0by1zZWxlY3QgYmVoYXZpb3IgdG8gdGhlIGV4cG9ydCBVUkxcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNjYWxlbmRhclN5bmMtaWNhbEV4cG9ydFVybCcpLFxyXG4gICAgICAgIGV2ZW50OiAnY2xpY2snLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAkKHRoaXMpLnNlbGVjdCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLmFwcC5tb2RlbC5jYWxlbmRhclN5bmNpbmcsXHJcbiAgICAgICAgZXZlbnQ6ICdlcnJvcicsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgIHZhciBtc2cgPSBlcnIudGFzayA9PT0gJ3NhdmUnID8gJ0Vycm9yIHNhdmluZyBjYWxlbmRhciBzeW5jaW5nIHNldHRpbmdzLicgOiAnRXJyb3IgbG9hZGluZyBjYWxlbmRhciBzeW5jaW5nIHNldHRpbmdzLic7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLm1vZGFscy5zaG93RXJyb3Ioe1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IG1zZyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnIgJiYgZXJyLnRhc2sgJiYgZXJyLmVycm9yIHx8IGVyclxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG59KTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcclxuXHJcbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KHN0YXRlKSB7XHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcclxuICAgIFxyXG4gICAgLy8gS2VlcCBkYXRhIHVwZGF0ZWQ6XHJcbiAgICB0aGlzLmFwcC5tb2RlbC5jYWxlbmRhclN5bmNpbmcuc3luYygpO1xyXG4gICAgLy8gRGlzY2FyZCBhbnkgcHJldmlvdXMgdW5zYXZlZCBlZGl0XHJcbiAgICB0aGlzLnZpZXdNb2RlbC5kaXNjYXJkKCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoYXBwKSB7XHJcblxyXG4gICAgdmFyIGNhbGVuZGFyU3luY2luZyA9IGFwcC5tb2RlbC5jYWxlbmRhclN5bmNpbmc7XHJcblxyXG4gICAgdmFyIHN5bmNWZXJzaW9uID0gY2FsZW5kYXJTeW5jaW5nLm5ld1ZlcnNpb24oKTtcclxuICAgIHN5bmNWZXJzaW9uLmlzT2Jzb2xldGUuc3Vic2NyaWJlKGZ1bmN0aW9uKGl0SXMpIHtcclxuICAgICAgICBpZiAoaXRJcykge1xyXG4gICAgICAgICAgICAvLyBuZXcgdmVyc2lvbiBmcm9tIHNlcnZlciB3aGlsZSBlZGl0aW5nXHJcbiAgICAgICAgICAgIC8vIEZVVFVSRTogd2FybiBhYm91dCBhIG5ldyByZW1vdGUgdmVyc2lvbiBhc2tpbmdcclxuICAgICAgICAgICAgLy8gY29uZmlybWF0aW9uIHRvIGxvYWQgdGhlbSBvciBkaXNjYXJkIGFuZCBvdmVyd3JpdGUgdGhlbTtcclxuICAgICAgICAgICAgLy8gdGhlIHNhbWUgaXMgbmVlZCBvbiBzYXZlKCksIGFuZCBvbiBzZXJ2ZXIgcmVzcG9uc2VcclxuICAgICAgICAgICAgLy8gd2l0aCBhIDUwOTpDb25mbGljdCBzdGF0dXMgKGl0cyBib2R5IG11c3QgY29udGFpbiB0aGVcclxuICAgICAgICAgICAgLy8gc2VydmVyIHZlcnNpb24pLlxyXG4gICAgICAgICAgICAvLyBSaWdodCBub3csIGp1c3Qgb3ZlcndyaXRlIGN1cnJlbnQgY2hhbmdlcyB3aXRoXHJcbiAgICAgICAgICAgIC8vIHJlbW90ZSBvbmVzOlxyXG4gICAgICAgICAgICBzeW5jVmVyc2lvbi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEFjdHVhbCBkYXRhIGZvciB0aGUgZm9ybTpcclxuICAgIHRoaXMuc3luYyA9IHN5bmNWZXJzaW9uLnZlcnNpb247XHJcblxyXG4gICAgdGhpcy5pc0xvY2tlZCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pc0xvY2tlZCgpIHx8IHRoaXMuaXNSZXNldGluZygpO1xyXG4gICAgfSwgY2FsZW5kYXJTeW5jaW5nKTtcclxuXHJcbiAgICB0aGlzLnN1Ym1pdFRleHQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcoKSA/IFxyXG4gICAgICAgICAgICAgICAgJ2xvYWRpbmcuLi4nIDogXHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzU2F2aW5nKCkgPyBcclxuICAgICAgICAgICAgICAgICAgICAnc2F2aW5nLi4uJyA6IFxyXG4gICAgICAgICAgICAgICAgICAgICdTYXZlJ1xyXG4gICAgICAgICk7XHJcbiAgICB9LCBjYWxlbmRhclN5bmNpbmcpO1xyXG4gICAgXHJcbiAgICB0aGlzLnJlc2V0VGV4dCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmlzUmVzZXRpbmcoKSA/IFxyXG4gICAgICAgICAgICAgICAgJ3Jlc2V0aW5nLi4uJyA6IFxyXG4gICAgICAgICAgICAgICAgJ1Jlc2V0IFByaXZhdGUgVVJMJ1xyXG4gICAgICAgICk7XHJcbiAgICB9LCBjYWxlbmRhclN5bmNpbmcpO1xyXG4gICAgXHJcbiAgICB0aGlzLmRpc2NhcmQgPSBmdW5jdGlvbiBkaXNjYXJkKCkge1xyXG4gICAgICAgIHN5bmNWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgICAgICAvLyBGb3JjZSB0byBzYXZlLCBldmVuIGlmIHRoZXJlIHdhcyByZW1vdGUgdXBkYXRlc1xyXG4gICAgICAgIHN5bmNWZXJzaW9uLnB1c2goeyBldmVuSWZPYnNvbGV0ZTogdHJ1ZSB9KTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIHRoaXMucmVzZXQgPSBmdW5jdGlvbiByZXNldCgpIHtcclxuICAgICAgICBjYWxlbmRhclN5bmNpbmcucmVzZXRFeHBvcnRVcmwoKTtcclxuICAgIH07XHJcbn1cclxuIiwiLyoqXG4gICAgQ2xpZW50RWRpdGlvbiBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIENsaWVudEVkaXRpb25BY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIFxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCgpO1xuICAgIFxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignY2xpZW50cycpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcbnZhciBDbGllbnQgPSByZXF1aXJlKCcuLi9tb2RlbHMvQ2xpZW50Jyk7XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcbiAgICBcbiAgICB0aGlzLmNsaWVudCA9IGtvLm9ic2VydmFibGUobmV3IENsaWVudCgpKTtcbiAgICBcbiAgICB0aGlzLmhlYWRlciA9IGtvLm9ic2VydmFibGUoJ0VkaXQgTG9jYXRpb24nKTtcbiAgICBcbiAgICAvLyBUT0RPXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24oKSB7fTtcbiAgICB0aGlzLmNhbmNlbCA9IGZ1bmN0aW9uKCkge307XG59XG4iLCIvKipcclxuICAgIGNsaWVudHMgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcclxuXHJcbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBDbGllbnRzQWN0aXZpdHkoKSB7XHJcbiAgICBcclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkZyZWVsYW5jZXI7XHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApOyAgICBcclxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignQ2xpZW50cycpO1xyXG4gICAgXHJcbiAgICAvLyBHZXR0aW5nIGVsZW1lbnRzXHJcbiAgICB0aGlzLiRpbmRleCA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNjbGllbnRzSW5kZXgnKTtcclxuICAgIHRoaXMuJGxpc3RWaWV3ID0gdGhpcy4kYWN0aXZpdHkuZmluZCgnI2NsaWVudHNMaXN0VmlldycpO1xyXG4gICAgXHJcbiAgICAvLyBUZXN0aW5nRGF0YVxyXG4gICAgdGhpcy52aWV3TW9kZWwuY2xpZW50cyhyZXF1aXJlKCcuLi90ZXN0ZGF0YS9jbGllbnRzJykuY2xpZW50cyk7XHJcbiAgICBcclxuICAgIC8vIEhhbmRsZXIgdG8gdXBkYXRlIGhlYWRlciBiYXNlZCBvbiBhIG1vZGUgY2hhbmdlOlxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwuaXNTZWxlY3Rpb25Nb2RlLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uIChpdElzKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmhlYWRlclRleHQoaXRJcyA/ICdTZWxlY3QgYSBjbGllbnQnIDogJycpO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gSGFuZGxlciB0byBnbyBiYWNrIHdpdGggdGhlIHNlbGVjdGVkIGNsaWVudCB3aGVuIFxyXG4gICAgLy8gdGhlcmUgaXMgb25lIHNlbGVjdGVkIGFuZCByZXF1ZXN0RGF0YSBpcyBmb3JcclxuICAgIC8vICdzZWxlY3QgbW9kZSdcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLnNlbGVjdGVkQ2xpZW50LFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uICh0aGVTZWxlY3RlZENsaWVudCkge1xyXG4gICAgICAgICAgICAvLyBXZSBoYXZlIGEgcmVxdWVzdCBhbmRcclxuICAgICAgICAgICAgLy8gaXQgcmVxdWVzdGVkIHRvIHNlbGVjdCBhIGNsaWVudCxcclxuICAgICAgICAgICAgLy8gYW5kIGEgc2VsZWN0ZWQgY2xpZW50XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnJlcXVlc3REYXRhICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3REYXRhLnNlbGVjdENsaWVudCA9PT0gdHJ1ZSAmJlxyXG4gICAgICAgICAgICAgICAgdGhlU2VsZWN0ZWRDbGllbnQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBQYXNzIHRoZSBzZWxlY3RlZCBjbGllbnQgaW4gdGhlIGluZm9cclxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdERhdGEuc2VsZWN0ZWRDbGllbnQgPSB0aGVTZWxlY3RlZENsaWVudDtcclxuICAgICAgICAgICAgICAgIC8vIEFuZCBnbyBiYWNrXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5zaGVsbC5nb0JhY2sodGhpcy5yZXF1ZXN0RGF0YSk7XHJcbiAgICAgICAgICAgICAgICAvLyBMYXN0LCBjbGVhciByZXF1ZXN0RGF0YVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RGF0YSA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBUT0RPOiBjaGVjayBlcnJvcnMgZnJvbSBsb2FkaW5nLCB3aWxsIGJlIFJlbW90ZU1vZGVsPz9cclxuICAgIC8qdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy5hcHAubW9kZWwuY2xpZW50cyxcclxuICAgICAgICBldmVudDogJ2Vycm9yJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgaWYgKGVyci50YXNrID09PSAnc2F2ZScpIHJldHVybjtcclxuICAgICAgICAgICAgdmFyIG1zZyA9ICdFcnJvciBsb2FkaW5nIGNsaWVudHMuJztcclxuICAgICAgICAgICAgdGhpcy5hcHAubW9kYWxzLnNob3dFcnJvcih7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogbXNnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVyciAmJiBlcnIudGFzayAmJiBlcnIuZXJyb3IgfHwgZXJyXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7Ki9cclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhzdGF0ZSkge1xyXG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBzdGF0ZSk7XHJcbiAgICBcclxuICAgIC8vIE9uIGV2ZXJ5IHNob3csIHNlYXJjaCBnZXRzIHJlc2V0ZWRcclxuICAgIHRoaXMudmlld01vZGVsLnNlYXJjaFRleHQoJycpO1xyXG4gICAgXHJcbiAgICAvLyBTZXQgc2VsZWN0aW9uOlxyXG4gICAgdGhpcy52aWV3TW9kZWwuaXNTZWxlY3Rpb25Nb2RlKHN0YXRlLnNlbGVjdENsaWVudCA9PT0gdHJ1ZSk7XHJcbiAgICBcclxuICAgIC8vIEtlZXAgZGF0YSB1cGRhdGVkOlxyXG4gICAgLy8gVE9ETzogYXMgUmVtb3RlTW9kZWw/XHJcbiAgICAvL3RoaXMuYXBwLm1vZGVsLmNsaWVudHMuc3luYygpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJycpO1xyXG5cclxuICAgIC8vIEVzcGVjaWFsIG1vZGUgd2hlbiBpbnN0ZWFkIG9mIHBpY2sgYW5kIGVkaXQgd2UgYXJlIGp1c3Qgc2VsZWN0aW5nXHJcbiAgICAvLyAod2hlbiBlZGl0aW5nIGFuIGFwcG9pbnRtZW50KVxyXG4gICAgdGhpcy5pc1NlbGVjdGlvbk1vZGUgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuXHJcbiAgICAvLyBGdWxsIGxpc3Qgb2YgY2xpZW50c1xyXG4gICAgdGhpcy5jbGllbnRzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcclxuICAgIFxyXG4gICAgLy8gU2VhcmNoIHRleHQsIHVzZWQgdG8gZmlsdGVyICdjbGllbnRzJ1xyXG4gICAgdGhpcy5zZWFyY2hUZXh0ID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcbiAgICBcclxuICAgIC8vIFV0aWxpdHkgdG8gZ2V0IGEgZmlsdGVyZWQgbGlzdCBvZiBjbGllbnRzIGJhc2VkIG9uIGNsaWVudHNcclxuICAgIHRoaXMuZ2V0RmlsdGVyZWRMaXN0ID0gZnVuY3Rpb24gZ2V0RmlsdGVyZWRMaXN0KCkge1xyXG4gICAgICAgIHZhciBzID0gKHRoaXMuc2VhcmNoVGV4dCgpIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnRzKCkuZmlsdGVyKGZ1bmN0aW9uKGNsaWVudCkge1xyXG4gICAgICAgICAgICB2YXIgbiA9IGNsaWVudCAmJiBjbGllbnQuZnVsbE5hbWUoKSB8fCAnJztcclxuICAgICAgICAgICAgbiA9IG4udG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgcmV0dXJuIG4uaW5kZXhPZihzKSA+IC0xO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBGaWx0ZXJlZCBsaXN0IG9mIGNsaWVudHNcclxuICAgIHRoaXMuZmlsdGVyZWRDbGllbnRzID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RmlsdGVyZWRMaXN0KCk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgLy8gR3JvdXBlZCBsaXN0IG9mIGZpbHRlcmVkIGNsaWVudHNcclxuICAgIHRoaXMuZ3JvdXBlZENsaWVudHMgPSBrby5jb21wdXRlZChmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICB2YXIgY2xpZW50cyA9IHRoaXMuZmlsdGVyZWRDbGllbnRzKCkuc29ydChmdW5jdGlvbihjbGllbnRBLCBjbGllbnRCKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjbGllbnRBLmZpcnN0TmFtZSgpID4gY2xpZW50Qi5maXJzdE5hbWUoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgZ3JvdXBzID0gW10sXHJcbiAgICAgICAgICAgIGxhdGVzdEdyb3VwID0gbnVsbCxcclxuICAgICAgICAgICAgbGF0ZXN0TGV0dGVyID0gbnVsbDtcclxuXHJcbiAgICAgICAgY2xpZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGNsaWVudCkge1xyXG4gICAgICAgICAgICB2YXIgbGV0dGVyID0gKGNsaWVudC5maXJzdE5hbWUoKVswXSB8fCAnJykudG9VcHBlckNhc2UoKTtcclxuICAgICAgICAgICAgaWYgKGxldHRlciAhPT0gbGF0ZXN0TGV0dGVyKSB7XHJcbiAgICAgICAgICAgICAgICBsYXRlc3RHcm91cCA9IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXR0ZXI6IGxldHRlcixcclxuICAgICAgICAgICAgICAgICAgICBjbGllbnRzOiBbY2xpZW50XVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGdyb3Vwcy5wdXNoKGxhdGVzdEdyb3VwKTtcclxuICAgICAgICAgICAgICAgIGxhdGVzdExldHRlciA9IGxldHRlcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxhdGVzdEdyb3VwLmNsaWVudHMucHVzaChjbGllbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBncm91cHM7XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2VsZWN0ZWRDbGllbnQgPSBrby5vYnNlcnZhYmxlKG51bGwpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlbGVjdENsaWVudCA9IGZ1bmN0aW9uKHNlbGVjdGVkQ2xpZW50KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZENsaWVudChzZWxlY3RlZENsaWVudCk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbn1cclxuIiwiLyoqXG4gICAgQ01TIGFjdGl2aXR5XG4gICAgKENsaWVudCBNYW5hZ2VtZW50IFN5c3RlbSlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQ21zQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIoJ0NsaWVudCBtYW5hZ2VtZW50Jyk7XG4gICAgXG4gICAgLy8gS2VlcCBjbGllbnRzQ291bnQgdXBkYXRlZFxuICAgIC8vIFRPRE8gdGhpcy5hcHAubW9kZWwuY2xpZW50c1xuICAgIHZhciBjbGllbnRzID0ga28ub2JzZXJ2YWJsZUFycmF5KHJlcXVpcmUoJy4uL3Rlc3RkYXRhL2NsaWVudHMnKS5jbGllbnRzKTtcbiAgICB0aGlzLnZpZXdNb2RlbC5jbGllbnRzQ291bnQoY2xpZW50cygpLmxlbmd0aCk7XG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xuICAgICAgICB0YXJnZXQ6IGNsaWVudHMsXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuY2xpZW50c0NvdW50KGNsaWVudHMoKS5sZW5ndGgpO1xuICAgICAgICB9LmJpbmQodGhpcylcbiAgICB9KTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcbiAgICBcbiAgICB0aGlzLmNsaWVudHNDb3VudCA9IGtvLm9ic2VydmFibGUoKTtcbn1cbiIsIi8qKlxuICAgIENvbnRhY3RGb3JtIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQ29udGFjdEZvcm1BY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIFxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCgpO1xuICAgIFxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignVGFsayB0byB1cycpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcbiAgICBcbiAgICB0aGlzLm1lc3NhZ2UgPSBrby5vYnNlcnZhYmxlKCcnKTtcbiAgICB0aGlzLndhc1NlbnQgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcblxuICAgIHZhciB1cGRhdGVXYXNTZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMud2FzU2VudChmYWxzZSk7XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIHRoaXMubWVzc2FnZS5zdWJzY3JpYmUodXBkYXRlV2FzU2VudCk7XG4gICAgXG4gICAgdGhpcy5zZW5kID0gZnVuY3Rpb24gc2VuZCgpIHtcbiAgICAgICAgLy8gVE9ETzogU2VuZFxuICAgICAgICBcbiAgICAgICAgLy8gUmVzZXQgYWZ0ZXIgYmVpbmcgc2VudFxuICAgICAgICB0aGlzLm1lc3NhZ2UoJycpO1xuICAgICAgICB0aGlzLndhc1NlbnQodHJ1ZSk7XG5cbiAgICB9LmJpbmQodGhpcyk7XG59XG4iLCIvKipcclxuICAgIENvbnRhY3RJbmZvIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XHJcblxyXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQ29udGFjdEluZm9BY3Rpdml0eSgpIHtcclxuICAgIFxyXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XHJcbiAgICBcclxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignT3duZXIgaW5mb3JtYXRpb24nKTtcclxuICAgIFxyXG4gICAgLy8gVXBkYXRlIG5hdkJhciBmb3Igb25ib2FyZGluZyBtb2RlIHdoZW4gdGhlIG9uYm9hcmRpbmdTdGVwXHJcbiAgICAvLyBpbiB0aGUgY3VycmVudCBtb2RlbCBjaGFuZ2VzOlxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwucHJvZmlsZS5vbmJvYXJkaW5nU3RlcCxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbiAoc3RlcCkge1xyXG4gICAgICAgICAgICBpZiAoc3RlcCkge1xyXG4gICAgICAgICAgICAgICAgLy8gVE9ETyBTZXQgbmF2YmFyIHN0ZXAgaW5kZXhcclxuICAgICAgICAgICAgICAgIC8vIFNldHRpbmcgbmF2YmFyIGZvciBPbmJvYXJkaW5nL3dpemFyZCBtb2RlXHJcbiAgICAgICAgICAgICAgICB0aGlzLm5hdkJhci5sZWZ0QWN0aW9uKCkudGV4dCgnJyk7XHJcbiAgICAgICAgICAgICAgICAvLyBTZXR0aW5nIGhlYWRlclxyXG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuaGVhZGVyVGV4dCgnSG93IGNhbiB3ZSByZWFjaCB5b3U/Jyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5idXR0b25UZXh0KCdTYXZlIGFuZCBjb250aW51ZScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gVE9ETyBSZW1vdmUgc3RlcCBpbmRleFxyXG4gICAgICAgICAgICAgICAgLy8gU2V0dGluZyBuYXZiYXIgdG8gZGVmYXVsdFxyXG4gICAgICAgICAgICAgICAgdGhpcy5uYXZCYXIubGVmdEFjdGlvbigpLnRleHQoJ0FjY291bnQnKTtcclxuICAgICAgICAgICAgICAgIC8vIFNldHRpbmcgaGVhZGVyIHRvIGRlZmF1bHRcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmhlYWRlclRleHQoJ0NvbnRhY3QgaW5mb3JtYXRpb24nKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmJ1dHRvblRleHQoJ1NhdmUnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbiAgICAvL3RoaXMudmlld01vZGVsLnByb2ZpbGUub25ib2FyZGluZ1N0ZXAuc3Vic2NyaWJlKCk7XHJcbiAgICBcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMuYXBwLm1vZGVsLnVzZXJQcm9maWxlLFxyXG4gICAgICAgIGV2ZW50OiAnZXJyb3InLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICB2YXIgbXNnID0gZXJyLnRhc2sgPT09ICdzYXZlJyA/ICdFcnJvciBzYXZpbmcgY29udGFjdCBkYXRhLicgOiAnRXJyb3IgbG9hZGluZyBjb250YWN0IGRhdGEuJztcclxuICAgICAgICAgICAgdGhpcy5hcHAubW9kYWxzLnNob3dFcnJvcih7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogbXNnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVyciAmJiBlcnIudGFzayAmJiBlcnIuZXJyb3IgfHwgZXJyXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMuYXBwLm1vZGVsLmhvbWVBZGRyZXNzLFxyXG4gICAgICAgIGV2ZW50OiAnZXJyb3InLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICB2YXIgbXNnID0gZXJyLnRhc2sgPT09ICdzYXZlJyA/ICdFcnJvciBzYXZpbmcgYWRkcmVzcyBkZXRhaWxzLicgOiAnRXJyb3IgbG9hZGluZyBhZGRyZXNzIGRldGFpbHMuJztcclxuICAgICAgICAgICAgdGhpcy5hcHAubW9kYWxzLnNob3dFcnJvcih7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogbXNnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVyciAmJiBlcnIudGFzayAmJiBlcnIuZXJyb3IgfHwgZXJyXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xyXG4gICAgXHJcbiAgICAvLyBEaXNjYXJkIGFueSBwcmV2aW91cyB1bnNhdmVkIGVkaXRcclxuICAgIHRoaXMudmlld01vZGVsLmRpc2NhcmQoKTtcclxuICAgIFxyXG4gICAgLy8gS2VlcCBkYXRhIHVwZGF0ZWQ6XHJcbiAgICB0aGlzLmFwcC5tb2RlbC51c2VyUHJvZmlsZS5zeW5jKCk7XHJcbiAgICB0aGlzLmFwcC5tb2RlbC5ob21lQWRkcmVzcy5zeW5jKCk7XHJcbn07XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKGFwcCkge1xyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJ0NvbnRhY3QgaW5mb3JtYXRpb24nKTtcclxuICAgIHRoaXMuYnV0dG9uVGV4dCA9IGtvLm9ic2VydmFibGUoJ1NhdmUnKTtcclxuICAgIFxyXG4gICAgLy8gVXNlciBQcm9maWxlXHJcbiAgICB2YXIgdXNlclByb2ZpbGUgPSBhcHAubW9kZWwudXNlclByb2ZpbGU7XHJcbiAgICB2YXIgcHJvZmlsZVZlcnNpb24gPSB1c2VyUHJvZmlsZS5uZXdWZXJzaW9uKCk7XHJcbiAgICBwcm9maWxlVmVyc2lvbi5pc09ic29sZXRlLnN1YnNjcmliZShmdW5jdGlvbihpdElzKSB7XHJcbiAgICAgICAgaWYgKGl0SXMpIHtcclxuICAgICAgICAgICAgLy8gbmV3IHZlcnNpb24gZnJvbSBzZXJ2ZXIgd2hpbGUgZWRpdGluZ1xyXG4gICAgICAgICAgICAvLyBGVVRVUkU6IHdhcm4gYWJvdXQgYSBuZXcgcmVtb3RlIHZlcnNpb24gYXNraW5nXHJcbiAgICAgICAgICAgIC8vIGNvbmZpcm1hdGlvbiB0byBsb2FkIHRoZW0gb3IgZGlzY2FyZCBhbmQgb3ZlcndyaXRlIHRoZW07XHJcbiAgICAgICAgICAgIC8vIHRoZSBzYW1lIGlzIG5lZWQgb24gc2F2ZSgpLCBhbmQgb24gc2VydmVyIHJlc3BvbnNlXHJcbiAgICAgICAgICAgIC8vIHdpdGggYSA1MDk6Q29uZmxpY3Qgc3RhdHVzIChpdHMgYm9keSBtdXN0IGNvbnRhaW4gdGhlXHJcbiAgICAgICAgICAgIC8vIHNlcnZlciB2ZXJzaW9uKS5cclxuICAgICAgICAgICAgLy8gUmlnaHQgbm93LCBqdXN0IG92ZXJ3cml0ZSBjdXJyZW50IGNoYW5nZXMgd2l0aFxyXG4gICAgICAgICAgICAvLyByZW1vdGUgb25lczpcclxuICAgICAgICAgICAgcHJvZmlsZVZlcnNpb24ucHVsbCh7IGV2ZW5JZk5ld2VyOiB0cnVlIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBBY3R1YWwgZGF0YSBmb3IgdGhlIGZvcm06XHJcbiAgICB0aGlzLnByb2ZpbGUgPSBwcm9maWxlVmVyc2lvbi52ZXJzaW9uO1xyXG4gICAgXHJcbiAgICAvLyBUT0RPIGwxMG5cclxuICAgIHRoaXMubW9udGhzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtcclxuICAgICAgICB7IGlkOiAxLCBuYW1lOiAnSmFudWFyeSd9LFxyXG4gICAgICAgIHsgaWQ6IDIsIG5hbWU6ICdGZWJydWFyeSd9LFxyXG4gICAgICAgIHsgaWQ6IDMsIG5hbWU6ICdNYXJjaCd9LFxyXG4gICAgICAgIHsgaWQ6IDQsIG5hbWU6ICdBcHJpbCd9LFxyXG4gICAgICAgIHsgaWQ6IDUsIG5hbWU6ICdNYXknfSxcclxuICAgICAgICB7IGlkOiA2LCBuYW1lOiAnSnVuZSd9LFxyXG4gICAgICAgIHsgaWQ6IDcsIG5hbWU6ICdKdWx5J30sXHJcbiAgICAgICAgeyBpZDogOCwgbmFtZTogJ0F1Z3VzdCd9LFxyXG4gICAgICAgIHsgaWQ6IDksIG5hbWU6ICdTZXB0ZW1iZXInfSxcclxuICAgICAgICB7IGlkOiAxMCwgbmFtZTogJ09jdG9iZXInfSxcclxuICAgICAgICB7IGlkOiAxMSwgbmFtZTogJ05vdmVtYmVyJ30sXHJcbiAgICAgICAgeyBpZDogMTIsIG5hbWU6ICdEZWNlbWJlcid9XHJcbiAgICBdKTtcclxuICAgIC8vIFdlIG5lZWQgdG8gdXNlIGEgc3BlY2lhbCBvYnNlcnZhYmxlIGluIHRoZSBmb3JtLCB0aGF0IHdpbGxcclxuICAgIC8vIHVwZGF0ZSB0aGUgYmFjay1lbmQgcHJvZmlsZS5iaXJ0aE1vbnRoXHJcbiAgICB0aGlzLnNlbGVjdGVkQmlydGhNb250aCA9IGtvLmNvbXB1dGVkKHtcclxuICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIGJpcnRoTW9udGggPSB0aGlzLnByb2ZpbGUuYmlydGhNb250aCgpO1xyXG4gICAgICAgICAgICByZXR1cm4gYmlydGhNb250aCA/IHRoaXMubW9udGhzKClbYmlydGhNb250aCAtIDFdIDogbnVsbDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHdyaXRlOiBmdW5jdGlvbihtb250aCkge1xyXG4gICAgICAgICAgICB0aGlzLnByb2ZpbGUuYmlydGhNb250aChtb250aCAmJiBtb250aC5pZCB8fCBudWxsKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG93bmVyOiB0aGlzXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgdGhpcy5tb250aERheXMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xyXG4gICAgZm9yICh2YXIgaWRheSA9IDE7IGlkYXkgPD0gMzE7IGlkYXkrKykge1xyXG4gICAgICAgIHRoaXMubW9udGhEYXlzLnB1c2goaWRheSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEhvbWUgQWRkcmVzc1xyXG4gICAgdmFyIGhvbWVBZGRyZXNzID0gYXBwLm1vZGVsLmhvbWVBZGRyZXNzO1xyXG4gICAgdmFyIGhvbWVBZGRyZXNzVmVyc2lvbiA9IGhvbWVBZGRyZXNzLm5ld1ZlcnNpb24oKTtcclxuICAgIGhvbWVBZGRyZXNzVmVyc2lvbi5pc09ic29sZXRlLnN1YnNjcmliZShmdW5jdGlvbihpdElzKSB7XHJcbiAgICAgICAgaWYgKGl0SXMpIHtcclxuICAgICAgICAgICAgLy8gbmV3IHZlcnNpb24gZnJvbSBzZXJ2ZXIgd2hpbGUgZWRpdGluZ1xyXG4gICAgICAgICAgICAvLyBGVVRVUkU6IHdhcm4gYWJvdXQgYSBuZXcgcmVtb3RlIHZlcnNpb24gYXNraW5nXHJcbiAgICAgICAgICAgIC8vIGNvbmZpcm1hdGlvbiB0byBsb2FkIHRoZW0gb3IgZGlzY2FyZCBhbmQgb3ZlcndyaXRlIHRoZW07XHJcbiAgICAgICAgICAgIC8vIHRoZSBzYW1lIGlzIG5lZWQgb24gc2F2ZSgpLCBhbmQgb24gc2VydmVyIHJlc3BvbnNlXHJcbiAgICAgICAgICAgIC8vIHdpdGggYSA1MDk6Q29uZmxpY3Qgc3RhdHVzIChpdHMgYm9keSBtdXN0IGNvbnRhaW4gdGhlXHJcbiAgICAgICAgICAgIC8vIHNlcnZlciB2ZXJzaW9uKS5cclxuICAgICAgICAgICAgLy8gUmlnaHQgbm93LCBqdXN0IG92ZXJ3cml0ZSBjdXJyZW50IGNoYW5nZXMgd2l0aFxyXG4gICAgICAgICAgICAvLyByZW1vdGUgb25lczpcclxuICAgICAgICAgICAgaG9tZUFkZHJlc3NWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gQWN0dWFsIGRhdGEgZm9yIHRoZSBmb3JtOlxyXG4gICAgdGhpcy5hZGRyZXNzID0gaG9tZUFkZHJlc3NWZXJzaW9uLnZlcnNpb247XHJcblxyXG4gICAgLy8gQ29udHJvbCBvYnNlcnZhYmxlczogc3BlY2lhbCBiZWNhdXNlIG11c3QgYSBtaXhcclxuICAgIC8vIG9mIHRoZSBib3RoIHJlbW90ZSBtb2RlbHMgdXNlZCBpbiB0aGlzIHZpZXdtb2RlbFxyXG4gICAgdGhpcy5pc0xvY2tlZCA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB1c2VyUHJvZmlsZS5pc0xvY2tlZCgpIHx8IGhvbWVBZGRyZXNzLmlzTG9ja2VkKCk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIHRoaXMuaXNMb2FkaW5nID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHVzZXJQcm9maWxlLmlzTG9hZGluZygpIHx8IGhvbWVBZGRyZXNzLmlzTG9hZGluZygpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICB0aGlzLmlzU2F2aW5nID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHVzZXJQcm9maWxlLmlzU2F2aW5nKCkgfHwgaG9tZUFkZHJlc3MuaXNTYXZpbmcoKTtcclxuICAgIH0sIHRoaXMpO1xyXG5cclxuICAgIHRoaXMuc3VibWl0VGV4dCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZygpID8gXHJcbiAgICAgICAgICAgICAgICAnbG9hZGluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNTYXZpbmcoKSA/IFxyXG4gICAgICAgICAgICAgICAgICAgICdzYXZpbmcuLi4nIDogXHJcbiAgICAgICAgICAgICAgICAgICAgJ1NhdmUnXHJcbiAgICAgICAgKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICAvLyBBY3Rpb25zXHJcblxyXG4gICAgdGhpcy5kaXNjYXJkID0gZnVuY3Rpb24gZGlzY2FyZCgpIHtcclxuICAgICAgICBwcm9maWxlVmVyc2lvbi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgaG9tZUFkZHJlc3NWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgICAgIC8vIEZvcmNlIHRvIHNhdmUsIGV2ZW4gaWYgdGhlcmUgd2FzIHJlbW90ZSB1cGRhdGVzXHJcbiAgICAgICAgcHJvZmlsZVZlcnNpb24ucHVzaCh7IGV2ZW5JZk9ic29sZXRlOiB0cnVlIH0pO1xyXG4gICAgICAgIGhvbWVBZGRyZXNzVmVyc2lvbi5wdXNoKHsgZXZlbklmT2Jzb2xldGU6IHRydWUgfSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbn1cclxuIiwiLyoqXG4gICAgQ29udmVyc2F0aW9uIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQ29udmVyc2F0aW9uQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ0luYm94Jyk7XG4gICAgXG4gICAgLy8gVGVzdGluZ0RhdGFcbiAgICBzZXRTb21lVGVzdGluZ0RhdGEodGhpcy52aWV3TW9kZWwpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcbiAgICBcbiAgICBpZiAoc3RhdGUgJiYgc3RhdGUucm91dGUgJiYgc3RhdGUucm91dGUuc2VnbWVudHMpIHtcbiAgICAgICAgdGhpcy52aWV3TW9kZWwuY29udmVyc2F0aW9uSUQocGFyc2VJbnQoc3RhdGUucm91dGUuc2VnbWVudHNbMF0sIDEwKSB8fCAwKTtcbiAgICB9XG59O1xuXG52YXIgTWFpbEZvbGRlciA9IHJlcXVpcmUoJy4uL21vZGVscy9NYWlsRm9sZGVyJyk7XG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG5cbiAgICB0aGlzLmluYm94ID0gbmV3IE1haWxGb2xkZXIoe1xuICAgICAgICB0b3BOdW1iZXI6IDIwXG4gICAgfSk7XG4gICAgXG4gICAgdGhpcy5jb252ZXJzYXRpb25JRCA9IGtvLm9ic2VydmFibGUobnVsbCk7XG4gICAgXG4gICAgdGhpcy5jb252ZXJzYXRpb24gPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb25JRCA9IHRoaXMuY29udmVyc2F0aW9uSUQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5ib3gubWVzc2FnZXMoKS5maWx0ZXIoZnVuY3Rpb24odikge1xuICAgICAgICAgICAgcmV0dXJuIHYgJiYgdi5pZCgpID09PSBjb25JRDtcbiAgICAgICAgfSk7XG4gICAgfSwgdGhpcyk7XG4gICAgXG4gICAgdGhpcy5zdWJqZWN0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbSA9IHRoaXMuY29udmVyc2F0aW9uKClbMF07XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBtID9cbiAgICAgICAgICAgIG0uc3ViamVjdCgpIDpcbiAgICAgICAgICAgICdDb252ZXJzYXRpb24gdy9vIHN1YmplY3QnXG4gICAgICAgICk7XG4gICAgICAgIFxuICAgIH0sIHRoaXMpO1xufVxuXG4vKiogVEVTVElORyBEQVRBICoqL1xuZnVuY3Rpb24gc2V0U29tZVRlc3RpbmdEYXRhKHZpZXdNb2RlbCkge1xuICAgIFxuICAgIHZpZXdNb2RlbC5pbmJveC5tZXNzYWdlcyhyZXF1aXJlKCcuLi90ZXN0ZGF0YS9tZXNzYWdlcycpLm1lc3NhZ2VzKTtcbn1cbiIsIi8qKlxyXG4gICAgZGF0ZXRpbWVQaWNrZXIgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIFRpbWUgPSByZXF1aXJlKCcuLi91dGlscy9UaW1lJyk7XHJcbnJlcXVpcmUoJy4uL2NvbXBvbmVudHMvRGF0ZVBpY2tlcicpO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIERhdGV0aW1lUGlja2VyQWN0aXZpdHkoKSB7XHJcbiAgICBcclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xyXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCcnKTtcclxuICAgIFxyXG4gICAgLy8gR2V0dGluZyBlbGVtZW50c1xyXG4gICAgdGhpcy4kZGF0ZVBpY2tlciA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNkYXRldGltZVBpY2tlckRhdGVQaWNrZXInKTtcclxuICAgIHRoaXMuJHRpbWVQaWNrZXIgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjZGF0ZXRpbWVQaWNrZXJUaW1lUGlja2VyJyk7XHJcbiAgICBcclxuICAgIC8qIEluaXQgY29tcG9uZW50cyAqL1xyXG4gICAgdGhpcy4kZGF0ZVBpY2tlci5zaG93KCkuZGF0ZXBpY2tlcigpO1xyXG4gICAgXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLiRkYXRlUGlja2VyLFxyXG4gICAgICAgIGV2ZW50OiAnY2hhbmdlRGF0ZScsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICBpZiAoZS52aWV3TW9kZSA9PT0gJ2RheXMnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZERhdGUoZS5kYXRlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLnNlbGVjdGVkRGF0ZSxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihkYXRlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYmluZERhdGVEYXRhKGRhdGUpO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEhhbmRsZXIgdG8gZ28gYmFjayB3aXRoIHRoZSBzZWxlY3RlZCBkYXRlLXRpbWUgd2hlblxyXG4gICAgLy8gdGhhdCBzZWxlY3Rpb24gaXMgZG9uZSAoY291bGQgYmUgdG8gbnVsbClcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLnNlbGVjdGVkRGF0ZXRpbWUsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24gKGRhdGV0aW1lKSB7XHJcbiAgICAgICAgICAgIC8vIFdlIGhhdmUgYSByZXF1ZXN0XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnJlcXVlc3REYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBQYXNzIHRoZSBzZWxlY3RlZCBkYXRldGltZSBpbiB0aGUgaW5mb1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RGF0YS5zZWxlY3RlZERhdGV0aW1lID0gZGF0ZXRpbWU7XHJcbiAgICAgICAgICAgICAgICAvLyBBbmQgZ28gYmFja1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ29CYWNrKHRoaXMucmVxdWVzdERhdGEpO1xyXG4gICAgICAgICAgICAgICAgLy8gTGFzdCwgY2xlYXIgcmVxdWVzdERhdGFcclxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdERhdGEgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gVGVzdGluZ0RhdGFcclxuICAgIHRoaXMudmlld01vZGVsLnNsb3RzRGF0YSA9IHJlcXVpcmUoJy4uL3Rlc3RkYXRhL3RpbWVTbG90cycpLnRpbWVTbG90cztcclxuICAgIFxyXG4gICAgdGhpcy5iaW5kRGF0ZURhdGEobmV3IERhdGUoKSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xyXG5cclxuICAgIC8vIFRPRE86IHRleHQgZnJvbSBvdXRzaWRlIG9yIGRlcGVuZGluZyBvbiBzdGF0ZT9cclxuICAgIHRoaXMudmlld01vZGVsLmhlYWRlclRleHQoJ1NlbGVjdCBhIHN0YXJ0IHRpbWUnKTtcclxufTtcclxuXHJcbkEucHJvdG90eXBlLmJpbmREYXRlRGF0YSA9IGZ1bmN0aW9uIGJpbmREYXRlRGF0YShkYXRlKSB7XHJcblxyXG4gICAgdmFyIHNkYXRlID0gbW9tZW50KGRhdGUpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xyXG4gICAgdmFyIHNsb3RzRGF0YSA9IHRoaXMudmlld01vZGVsLnNsb3RzRGF0YTtcclxuXHJcbiAgICBpZiAoc2xvdHNEYXRhLmhhc093blByb3BlcnR5KHNkYXRlKSkge1xyXG4gICAgICAgIHRoaXMudmlld01vZGVsLnNsb3RzKHNsb3RzRGF0YVtzZGF0ZV0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnZpZXdNb2RlbC5zbG90cyhzbG90c0RhdGFbJ2RlZmF1bHQnXSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XHJcblxyXG4gICAgdGhpcy5oZWFkZXJUZXh0ID0ga28ub2JzZXJ2YWJsZSgnU2VsZWN0IGEgdGltZScpO1xyXG4gICAgdGhpcy5zZWxlY3RlZERhdGUgPSBrby5vYnNlcnZhYmxlKG5ldyBEYXRlKCkpO1xyXG4gICAgdGhpcy5zbG90c0RhdGEgPSB7fTtcclxuICAgIHRoaXMuc2xvdHMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xyXG4gICAgdGhpcy5ncm91cGVkU2xvdHMgPSBrby5jb21wdXRlZChmdW5jdGlvbigpe1xyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICBiZWZvcmUgMTI6MDBwbSAobm9vbikgPSBtb3JuaW5nXHJcbiAgICAgICAgICBhZnRlcm5vb246IDEyOjAwcG0gdW50aWwgNTowMHBtXHJcbiAgICAgICAgICBldmVuaW5nOiA1OjAwcG0gLSAxMTo1OXBtXHJcbiAgICAgICAgKi9cclxuICAgICAgICAvLyBTaW5jZSBzbG90cyBtdXN0IGJlIGZvciB0aGUgc2FtZSBkYXRlLFxyXG4gICAgICAgIC8vIHRvIGRlZmluZSB0aGUgZ3JvdXBzIHJhbmdlcyB1c2UgdGhlIGZpcnN0IGRhdGVcclxuICAgICAgICB2YXIgZGF0ZVBhcnQgPSB0aGlzLnNsb3RzKCkgJiYgdGhpcy5zbG90cygpWzBdIHx8IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgdmFyIGdyb3VwcyA9IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZ3JvdXA6ICdNb3JuaW5nJyxcclxuICAgICAgICAgICAgICAgIHNsb3RzOiBbXSxcclxuICAgICAgICAgICAgICAgIHN0YXJ0czogbmV3IFRpbWUoZGF0ZVBhcnQsIDAsIDApLFxyXG4gICAgICAgICAgICAgICAgZW5kczogbmV3IFRpbWUoZGF0ZVBhcnQsIDEyLCAwKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBncm91cDogJ0FmdGVybm9vbicsXHJcbiAgICAgICAgICAgICAgICBzbG90czogW10sXHJcbiAgICAgICAgICAgICAgICBzdGFydHM6IG5ldyBUaW1lKGRhdGVQYXJ0LCAxMiwgMCksXHJcbiAgICAgICAgICAgICAgICBlbmRzOiBuZXcgVGltZShkYXRlUGFydCwgMTcsIDApXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGdyb3VwOiAnRXZlbmluZycsXHJcbiAgICAgICAgICAgICAgICBzbG90czogW10sXHJcbiAgICAgICAgICAgICAgICBzdGFydHM6IG5ldyBUaW1lKGRhdGVQYXJ0LCAxNywgMCksXHJcbiAgICAgICAgICAgICAgICBlbmRzOiBuZXcgVGltZShkYXRlUGFydCwgMjQsIDApXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdO1xyXG4gICAgICAgIHZhciBzbG90cyA9IHRoaXMuc2xvdHMoKS5zb3J0KCk7XHJcbiAgICAgICAgc2xvdHMuZm9yRWFjaChmdW5jdGlvbihzbG90KSB7XHJcbiAgICAgICAgICAgIGdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uKGdyb3VwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2xvdCA+PSBncm91cC5zdGFydHMgJiZcclxuICAgICAgICAgICAgICAgICAgICBzbG90IDwgZ3JvdXAuZW5kcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwLnNsb3RzLnB1c2goc2xvdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gZ3JvdXBzO1xyXG5cclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlbGVjdGVkRGF0ZXRpbWUgPSBrby5vYnNlcnZhYmxlKG51bGwpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlbGVjdERhdGV0aW1lID0gZnVuY3Rpb24oc2VsZWN0ZWREYXRldGltZSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWREYXRldGltZShzZWxlY3RlZERhdGV0aW1lKTtcclxuXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcblxyXG59XHJcbiIsIi8qKlxuICAgIEZhcXMgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBGYXFzQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ1RhbGsgdG8gdXMnKTtcbiAgICBcbiAgICAvLyBUZXN0aW5nRGF0YVxuICAgIHNldFNvbWVUZXN0aW5nRGF0YSh0aGlzLnZpZXdNb2RlbCk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhzdGF0ZSkge1xuICAgIFxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xuICAgIFxuICAgIHRoaXMudmlld01vZGVsLnNlYXJjaFRleHQoJycpO1xufTtcblxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG4gICAgdGhpcy5mYXFzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcbiAgICB0aGlzLnNlYXJjaFRleHQgPSBrby5vYnNlcnZhYmxlKCcnKTtcbiAgICBcbiAgICB0aGlzLmZpbHRlcmVkRmFxcyA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHMgPSB0aGlzLnNlYXJjaFRleHQoKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICByZXR1cm4gdGhpcy5mYXFzKCkuZmlsdGVyKGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICAgIHZhciBuID0gdiAmJiB2LnRpdGxlKCkgfHwgJyc7XG4gICAgICAgICAgICBuICs9IHYgJiYgdi5kZXNjcmlwdGlvbigpIHx8ICcnO1xuICAgICAgICAgICAgbiA9IG4udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHJldHVybiBuLmluZGV4T2YocykgPiAtMTtcbiAgICAgICAgfSk7XG4gICAgfSwgdGhpcyk7XG59XG5cbnZhciBNb2RlbCA9IHJlcXVpcmUoJy4uL21vZGVscy9Nb2RlbCcpO1xuZnVuY3Rpb24gRmFxKHZhbHVlcykge1xuICAgIFxuICAgIE1vZGVsKHRoaXMpO1xuXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcbiAgICAgICAgaWQ6IDAsXG4gICAgICAgIHRpdGxlOiAnJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICcnXG4gICAgfSwgdmFsdWVzKTtcbn1cblxuLyoqIFRFU1RJTkcgREFUQSAqKi9cbmZ1bmN0aW9uIHNldFNvbWVUZXN0aW5nRGF0YSh2aWV3TW9kZWwpIHtcbiAgICBcbiAgICB2YXIgdGVzdGRhdGEgPSBbXG4gICAgICAgIG5ldyBGYXEoe1xuICAgICAgICAgICAgaWQ6IDEsXG4gICAgICAgICAgICB0aXRsZTogJ0hvdyBkbyBJIHNldCB1cCBhIG1hcmtldHBsYWNlIHByb2ZpbGU/JyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGVzY3JpcHRpb24gYWJvdXQgaG93IEkgc2V0IHVwIGEgbWFya2V0cGxhY2UgcHJvZmlsZSdcbiAgICAgICAgfSksXG4gICAgICAgIG5ldyBGYXEoe1xuICAgICAgICAgICAgaWQ6IDIsXG4gICAgICAgICAgICB0aXRsZTogJ0Fub3RoZXIgZmFxJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQW5vdGhlciBkZXNjcmlwdGlvbidcbiAgICAgICAgfSlcbiAgICBdO1xuICAgIHZpZXdNb2RlbC5mYXFzKHRlc3RkYXRhKTtcbn1cbiIsIi8qKlxuICAgIEZlZWRiYWNrIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gRmVlZGJhY2tBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKCdUYWxrIHRvIHVzJyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuIiwiLyoqXG4gICAgRmVlZGJhY2tGb3JtIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gRmVlZGJhY2tGb3JtQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ1RhbGsgdG8gdXMnKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgXG4gICAgdGhpcy5tZXNzYWdlID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgdGhpcy5iZWNvbWVDb2xsYWJvcmF0b3IgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcbiAgICB0aGlzLndhc1NlbnQgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcblxuICAgIHZhciB1cGRhdGVXYXNTZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMud2FzU2VudChmYWxzZSk7XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIHRoaXMubWVzc2FnZS5zdWJzY3JpYmUodXBkYXRlV2FzU2VudCk7XG4gICAgdGhpcy5iZWNvbWVDb2xsYWJvcmF0b3Iuc3Vic2NyaWJlKHVwZGF0ZVdhc1NlbnQpO1xuICAgIFxuICAgIHRoaXMuc2VuZCA9IGZ1bmN0aW9uIHNlbmQoKSB7XG4gICAgICAgIC8vIFRPRE86IFNlbmRcbiAgICAgICAgXG4gICAgICAgIC8vIFJlc2V0IGFmdGVyIGJlaW5nIHNlbnRcbiAgICAgICAgdGhpcy5tZXNzYWdlKCcnKTtcbiAgICAgICAgdGhpcy5iZWNvbWVDb2xsYWJvcmF0b3IoZmFsc2UpO1xuICAgICAgICB0aGlzLndhc1NlbnQodHJ1ZSk7XG5cbiAgICB9LmJpbmQodGhpcyk7XG59XG4iLCIvKipcbiAgICBIb21lIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gSG9tZUFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xuICAgIC8vIG51bGwgZm9yIGxvZ29cbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIobnVsbCk7XG4gICAgXG4gICAgLy8gR2V0dGluZyBlbGVtZW50c1xuICAgIHRoaXMuJG5leHRCb29raW5nID0gdGhpcy4kYWN0aXZpdHkuZmluZCgnI2hvbWVOZXh0Qm9va2luZycpO1xuICAgIHRoaXMuJHVwY29taW5nQm9va2luZ3MgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjaG9tZVVwY29taW5nQm9va2luZ3MnKTtcbiAgICB0aGlzLiRpbmJveCA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNob21lSW5ib3gnKTtcbiAgICB0aGlzLiRwZXJmb3JtYW5jZSA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNob21lUGVyZm9ybWFuY2UnKTtcbiAgICB0aGlzLiRnZXRNb3JlID0gdGhpcy4kYWN0aXZpdHkuZmluZCgnI2hvbWVHZXRNb3JlJyk7XG4gICAgXG4gICAgLy8gVGVzdGluZ0RhdGFcbiAgICBzZXRTb21lVGVzdGluZ0RhdGEodGhpcy52aWV3TW9kZWwpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgXG4gICAgdmFyIHYgPSB0aGlzLnZpZXdNb2RlbCxcbiAgICAgICAgYXBwTW9kZWwgPSB0aGlzLmFwcC5tb2RlbDtcbiAgICBcbiAgICAvLyBVcGRhdGUgZGF0YVxuICAgIGFwcE1vZGVsLmJvb2tpbmdzLmdldFVwY29taW5nQm9va2luZ3MoKS50aGVuKGZ1bmN0aW9uKHVwY29taW5nKSB7XG5cbiAgICAgICAgaWYgKHVwY29taW5nLm5leHRCb29raW5nSUQpIHtcbiAgICAgICAgICAgIHZhciBwcmV2aW91c0lEID0gdi5uZXh0Qm9va2luZygpICYmIHYubmV4dEJvb2tpbmcoKS5zb3VyY2VCb29raW5nKCkuYm9va2luZ0lEKCk7XG4gICAgICAgICAgICBpZiAodXBjb21pbmcubmV4dEJvb2tpbmdJRCAhPT0gcHJldmlvdXNJRCkge1xuICAgICAgICAgICAgICAgIHYuaXNMb2FkaW5nTmV4dEJvb2tpbmcodHJ1ZSk7XG4gICAgICAgICAgICAgICAgYXBwTW9kZWwuYXBwb2ludG1lbnRzLmdldEFwcG9pbnRtZW50KHsgYm9va2luZ0lEOiB1cGNvbWluZy5uZXh0Qm9va2luZ0lEIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oYXB0KSB7XG4gICAgICAgICAgICAgICAgICAgIHYubmV4dEJvb2tpbmcoYXB0KTtcbiAgICAgICAgICAgICAgICAgICAgdi5pc0xvYWRpbmdOZXh0Qm9va2luZyhmYWxzZSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHYuaXNMb2FkaW5nTmV4dEJvb2tpbmcoZmFsc2UpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdi5uZXh0Qm9va2luZyhudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHYudXBjb21pbmdCb29raW5ncy50b2RheS5xdWFudGl0eSh1cGNvbWluZy50b2RheS5xdWFudGl0eSk7XG4gICAgICAgIHYudXBjb21pbmdCb29raW5ncy50b2RheS50aW1lKHVwY29taW5nLnRvZGF5LnRpbWUgJiYgbmV3IERhdGUodXBjb21pbmcudG9kYXkudGltZSkpO1xuICAgICAgICB2LnVwY29taW5nQm9va2luZ3MudG9tb3Jyb3cucXVhbnRpdHkodXBjb21pbmcudG9tb3Jyb3cucXVhbnRpdHkpO1xuICAgICAgICB2LnVwY29taW5nQm9va2luZ3MudG9tb3Jyb3cudGltZSh1cGNvbWluZy50b21vcnJvdy50aW1lICYmIG5ldyBEYXRlKHVwY29taW5nLnRvbW9ycm93LnRpbWUpKTtcbiAgICAgICAgdi51cGNvbWluZ0Jvb2tpbmdzLm5leHRXZWVrLnF1YW50aXR5KHVwY29taW5nLm5leHRXZWVrLnF1YW50aXR5KTtcbiAgICAgICAgdi51cGNvbWluZ0Jvb2tpbmdzLm5leHRXZWVrLnRpbWUodXBjb21pbmcubmV4dFdlZWsudGltZSAmJiBuZXcgRGF0ZSh1cGNvbWluZy5uZXh0V2Vlay50aW1lKSk7XG4gICAgfSk7XG59O1xuXG5cbnZhciBVcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeSA9IHJlcXVpcmUoJy4uL21vZGVscy9VcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeScpLFxuICAgIE1haWxGb2xkZXIgPSByZXF1aXJlKCcuLi9tb2RlbHMvTWFpbEZvbGRlcicpLFxuICAgIFBlcmZvcm1hbmNlU3VtbWFyeSA9IHJlcXVpcmUoJy4uL21vZGVscy9QZXJmb3JtYW5jZVN1bW1hcnknKSxcbiAgICBHZXRNb3JlID0gcmVxdWlyZSgnLi4vbW9kZWxzL0dldE1vcmUnKTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG4gICAgdGhpcy51cGNvbWluZ0Jvb2tpbmdzID0gbmV3IFVwY29taW5nQm9va2luZ3NTdW1tYXJ5KCk7XG5cbiAgICAvLyA6QXBwb2ludG1lbnRcbiAgICB0aGlzLm5leHRCb29raW5nID0ga28ub2JzZXJ2YWJsZShudWxsKTtcbiAgICB0aGlzLmlzTG9hZGluZ05leHRCb29raW5nID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG4gICAgXG4gICAgdGhpcy5pbmJveCA9IG5ldyBNYWlsRm9sZGVyKHtcbiAgICAgICAgdG9wTnVtYmVyOiA0XG4gICAgfSk7XG4gICAgXG4gICAgdGhpcy5wZXJmb3JtYW5jZSA9IG5ldyBQZXJmb3JtYW5jZVN1bW1hcnkoKTtcbiAgICBcbiAgICB0aGlzLmdldE1vcmUgPSBuZXcgR2V0TW9yZSgpO1xufVxuXG4vKiogVEVTVElORyBEQVRBICoqL1xuZnVuY3Rpb24gc2V0U29tZVRlc3RpbmdEYXRhKHZpZXdNb2RlbCkge1xuICAgIFxuICAgIHZpZXdNb2RlbC5pbmJveC5tZXNzYWdlcyhyZXF1aXJlKCcuLi90ZXN0ZGF0YS9tZXNzYWdlcycpLm1lc3NhZ2VzKTtcbiAgICBcbiAgICB2aWV3TW9kZWwucGVyZm9ybWFuY2UuZWFybmluZ3MuY3VycmVudEFtb3VudCgyNDAwKTtcbiAgICB2aWV3TW9kZWwucGVyZm9ybWFuY2UuZWFybmluZ3MubmV4dEFtb3VudCg2MjAwLjU0KTtcbiAgICB2aWV3TW9kZWwucGVyZm9ybWFuY2UudGltZUJvb2tlZC5wZXJjZW50KDAuOTMpO1xuICAgIFxuICAgIHZpZXdNb2RlbC5nZXRNb3JlLm1vZGVsLnVwZGF0ZVdpdGgoe1xuICAgICAgICBhdmFpbGFiaWxpdHk6IHRydWUsXG4gICAgICAgIHBheW1lbnRzOiB0cnVlLFxuICAgICAgICBwcm9maWxlOiB0cnVlLFxuICAgICAgICBjb29wOiB0cnVlXG4gICAgfSk7XG59XG4iLCIvKipcbiAgICBJbmJveCBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBJbmJveEFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKCdJbmJveCcpO1xuICAgIFxuICAgIC8vdGhpcy4kaW5ib3ggPSAkYWN0aXZpdHkuZmluZCgnI2luYm94TGlzdCcpO1xuICAgIFxuICAgIC8vIFRlc3RpbmdEYXRhXG4gICAgc2V0U29tZVRlc3RpbmdEYXRhKHRoaXMudmlld01vZGVsKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbnZhciBNYWlsRm9sZGVyID0gcmVxdWlyZSgnLi4vbW9kZWxzL01haWxGb2xkZXInKTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG4gICAgdGhpcy5pbmJveCA9IG5ldyBNYWlsRm9sZGVyKHtcbiAgICAgICAgdG9wTnVtYmVyOiAyMFxuICAgIH0pO1xuICAgIFxuICAgIHRoaXMuc2VhcmNoVGV4dCA9IGtvLm9ic2VydmFibGUoJycpO1xufVxuXG4vKiogVEVTVElORyBEQVRBICoqL1xuZnVuY3Rpb24gc2V0U29tZVRlc3RpbmdEYXRhKGRhdGFWaWV3KSB7XG4gICAgXG4gICAgZGF0YVZpZXcuaW5ib3gubWVzc2FnZXMocmVxdWlyZSgnLi4vdGVzdGRhdGEvbWVzc2FnZXMnKS5tZXNzYWdlcyk7XG59XG4iLCIvKipcbiAgICBJbmRleCBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEluZGV4QWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIC8vIEFueSB1c2VyIGNhbiBhY2Nlc3MgdGhpc1xuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBudWxsO1xuICAgIFxuICAgIC8vIG51bGwgZm9yIGxvZ29cbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIobnVsbCk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhzdGF0ZSkge1xuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xuICAgIFxuICAgIC8vIEl0IGNoZWNrcyBpZiB0aGUgdXNlciBpcyBsb2dnZWQgc28gdGhlbiBcbiAgICAvLyB0aGVpciAnbG9nZ2VkIGluZGV4JyBpcyB0aGUgZGFzaGJvYXJkIG5vdCB0aGlzXG4gICAgLy8gcGFnZSB0aGF0IGlzIGZvY3VzZWQgb24gYW5vbnltb3VzIHVzZXJzXG4gICAgaWYgKCF0aGlzLmFwcC5tb2RlbC51c2VyKCkuaXNBbm9ueW1vdXMoKSkge1xuICAgICAgICB0aGlzLmFwcC5nb0Rhc2hib2FyZCgpO1xuICAgIH1cbn07XG4iLCIvKipcbiAgICBKb2J0aXRsZXMgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5JyksXG4gICAgVXNlckpvYlByb2ZpbGVWaWV3TW9kZWwgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL1VzZXJKb2JQcm9maWxlJyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBKb2J0aXRsZXNBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIFxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFVzZXJKb2JQcm9maWxlVmlld01vZGVsKHRoaXMuYXBwKTtcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ1NjaGVkdWxpbmcnKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KHN0YXRlKSB7XG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBzdGF0ZSk7XG5cbiAgICB0aGlzLnZpZXdNb2RlbC5zeW5jKCk7XG5cbiAgICAvLy8vIFNldCB0aGUgam9iIHRpdGxlXG4gICAgLy92YXIgam9iSUQgPSBzdGF0ZS5yb3V0ZS5zZWdtZW50c1swXSB8MDtcbiAgICAvL3RoaXMudmlld01vZGVsLmpvYlRpdGxlSUQoam9iSUQpO1xufTtcbiIsIi8qKlxuICAgIExlYXJuTW9yZSBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxuICAgIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gTGVhcm5Nb3JlQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XG4gICAgLy8gbnVsbCBmb3IgbG9nb1xuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU2VjdGlvbk5hdkJhcihudWxsKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgIFxuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMucm91dGUgJiZcbiAgICAgICAgb3B0aW9ucy5yb3V0ZS5zZWdtZW50cyAmJlxuICAgICAgICBvcHRpb25zLnJvdXRlLnNlZ21lbnRzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLnZpZXdNb2RlbC5wcm9maWxlKG9wdGlvbnMucm91dGUuc2VnbWVudHNbMF0pO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcbiAgICB0aGlzLnByb2ZpbGUgPSBrby5vYnNlcnZhYmxlKCdjdXN0b21lcicpO1xufVxuIiwiLyoqXG4gICAgTG9jYXRpb25FZGl0aW9uIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXG4gICAgTG9jYXRpb24gPSByZXF1aXJlKCcuLi9tb2RlbHMvTG9jYXRpb24nKSxcbiAgICBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIExvY2F0aW9uRWRpdGlvbkFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuRnJlZWxhbmNlcjtcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignTG9jYXRpb25zJyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG4gICAgLy9qc2hpbnQgbWF4Y29tcGxleGl0eToxMFxuICAgIFxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgXG4gICAgdmFyIGlkID0gMCxcbiAgICAgICAgY3JlYXRlID0gJyc7XG5cbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucy5sb2NhdGlvbklEKSB7XG4gICAgICAgICAgICBpZCA9IG9wdGlvbnMubG9jYXRpb25JRDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvcHRpb25zLnJvdXRlICYmIG9wdGlvbnMucm91dGUuc2VnbWVudHMpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWQgPSBwYXJzZUludChvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvcHRpb25zLmNyZWF0ZSkge1xuICAgICAgICAgICAgY3JlYXRlID0gb3B0aW9ucy5jcmVhdGU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaWYgKGlkKSB7XG4gICAgICAgIC8vIFRPRE9cbiAgICAgICAgLy8gdmFyIGxvY2F0aW9uID0gdGhpcy5hcHAubW9kZWwuZ2V0TG9jYXRpb24oaWQpXG4gICAgICAgIC8vIE5PVEUgdGVzdGluZyBkYXRhXG4gICAgICAgIHZhciBsb2NhdGlvbnMgPSB7XG4gICAgICAgICAgICAnMSc6IG5ldyBMb2NhdGlvbih7XG4gICAgICAgICAgICAgICAgbG9jYXRpb25JRDogMSxcbiAgICAgICAgICAgICAgICBuYW1lOiAnSG9tZScsXG4gICAgICAgICAgICAgICAgYWRkcmVzc0xpbmUxOiAnSGVyZSBTdHJlZXQnLFxuICAgICAgICAgICAgICAgIGNpdHk6ICdTYW4gRnJhbmNpc2NvJyxcbiAgICAgICAgICAgICAgICBwb3N0YWxDb2RlOiAnOTAwMDEnLFxuICAgICAgICAgICAgICAgIHN0YXRlUHJvdmluY2VDb2RlOiAnQ0EnLFxuICAgICAgICAgICAgICAgIGNvdW50cnlJRDogMSxcbiAgICAgICAgICAgICAgICBpc1NlcnZpY2VSYWRpdXM6IHRydWUsXG4gICAgICAgICAgICAgICAgaXNTZXJ2aWNlTG9jYXRpb246IGZhbHNlXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICcyJzogbmV3IExvY2F0aW9uKHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbklEOiAxLFxuICAgICAgICAgICAgICAgIG5hbWU6ICdXb3Jrc2hvcCcsXG4gICAgICAgICAgICAgICAgYWRkcmVzc0xpbmUxOiAnVW5rbm93IFN0cmVldCcsXG4gICAgICAgICAgICAgICAgY2l0eTogJ1NhbiBGcmFuY2lzY28nLFxuICAgICAgICAgICAgICAgIHBvc3RhbENvZGU6ICc5MDAwMScsXG4gICAgICAgICAgICAgICAgc3RhdGVQcm92aW5jZUNvZGU6ICdDQScsXG4gICAgICAgICAgICAgICAgY291bnRyeUlEOiAxLFxuICAgICAgICAgICAgICAgIGlzU2VydmljZVJhZGl1czogZmFsc2UsXG4gICAgICAgICAgICAgICAgaXNTZXJ2aWNlTG9jYXRpb246IHRydWVcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH07XG4gICAgICAgIHZhciBsb2NhdGlvbiA9IGxvY2F0aW9uc1tpZF07XG4gICAgICAgIGlmIChsb2NhdGlvbikge1xuICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwubG9jYXRpb24obG9jYXRpb24pO1xuXG4gICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5oZWFkZXIoJ0VkaXQgTG9jYXRpb24nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmxvY2F0aW9uKG51bGwpO1xuICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuaGVhZGVyKCdVbmtub3cgbG9jYXRpb24gb3Igd2FzIGRlbGV0ZWQnKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgLy8gTmV3IGxvY2F0aW9uXG4gICAgICAgIHRoaXMudmlld01vZGVsLmxvY2F0aW9uKG5ldyBMb2NhdGlvbigpKTtcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAob3B0aW9ucy5jcmVhdGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ3NlcnZpY2VSYWRpdXMnOlxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmxvY2F0aW9uKCkuaXNTZXJ2aWNlUmFkaXVzKHRydWUpO1xuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmhlYWRlcignQWRkIGEgc2VydmljZSByYWRpdXMnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3NlcnZpY2VMb2NhdGlvbic6XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwubG9jYXRpb24oKS5pc1NlcnZpY2VMb2NhdGlvbih0cnVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5oZWFkZXIoJ0FkZCBhIHNlcnZpY2UgbG9jYXRpb24nKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwubG9jYXRpb24oKS5pc1NlcnZpY2VSYWRpdXModHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwubG9jYXRpb24oKS5pc1NlcnZpY2VMb2NhdGlvbih0cnVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5oZWFkZXIoJ0FkZCBhIGxvY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgXG4gICAgdGhpcy5sb2NhdGlvbiA9IGtvLm9ic2VydmFibGUobmV3IExvY2F0aW9uKCkpO1xuICAgIFxuICAgIHRoaXMuaGVhZGVyID0ga28ub2JzZXJ2YWJsZSgnRWRpdCBMb2NhdGlvbicpO1xuICAgIFxuICAgIC8vIFRPRE9cbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbigpIHt9O1xuICAgIHRoaXMuY2FuY2VsID0gZnVuY3Rpb24oKSB7fTtcbn0iLCIvKipcclxuICAgIGxvY2F0aW9ucyBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIExvY2F0aW9uc0FjdGl2aXR5KCkge1xyXG4gICAgXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcclxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignU2NoZWR1bGluZycpO1xyXG4gICAgXHJcbiAgICAvLyBHZXR0aW5nIGVsZW1lbnRzXHJcbiAgICB0aGlzLiRsaXN0VmlldyA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNsb2NhdGlvbnNMaXN0VmlldycpO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyIHRvIHVwZGF0ZSBoZWFkZXIgYmFzZWQgb24gYSBtb2RlIGNoYW5nZTpcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLmlzU2VsZWN0aW9uTW9kZSxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbiAoaXRJcykge1xyXG4gICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5oZWFkZXJUZXh0KGl0SXMgPyAnU2VsZWN0IG9yIGFkZCBhIHNlcnZpY2UgbG9jYXRpb24nIDogJ0xvY2F0aW9ucycpO1xyXG5cclxuICAgICAgICAgICAgLy8gVXBkYXRlIG5hdmJhciB0b29cclxuICAgICAgICAgICAgLy8gVE9ETzogQ2FuIGJlIG90aGVyIHRoYW4gJ3NjaGVkdWxpbmcnLCBsaWtlIG1hcmtldHBsYWNlIHByb2ZpbGUgb3IgdGhlIGpvYi10aXRsZT9cclxuICAgICAgICAgICAgdGhpcy5uYXZCYXIubGVmdEFjdGlvbigpLnRleHQoaXRJcyA/ICdCb29raW5nJyA6ICdTY2hlZHVsaW5nJyk7XHJcbiAgICAgICAgICAgIC8vIFRpdGxlIG11c3QgYmUgZW1wdHlcclxuICAgICAgICAgICAgdGhpcy5uYXZCYXIudGl0bGUoJycpO1xyXG5cclxuICAgICAgICAgICAgLy8gVE9ETyBSZXBsYWNlZCBieSBhIHByb2dyZXNzIGJhciBvbiBib29raW5nIGNyZWF0aW9uXHJcbiAgICAgICAgICAgIC8vIFRPRE8gT3IgbGVmdEFjdGlvbigpLnRleHQoLi4pIG9uIGJvb2tpbmcgZWRpdGlvbiAocmV0dXJuIHRvIGJvb2tpbmcpXHJcbiAgICAgICAgICAgIC8vIG9yIGNvbWluZyBmcm9tIEpvYnRpdGxlL3NjaGVkdWxlIChyZXR1cm4gdG8gc2NoZWR1bGUvam9iIHRpdGxlKT9cclxuXHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciB0byBnbyBiYWNrIHdpdGggdGhlIHNlbGVjdGVkIGxvY2F0aW9uIHdoZW4gXHJcbiAgICAvLyBzZWxlY3Rpb24gbW9kZSBnb2VzIG9mZiBhbmQgcmVxdWVzdEluZm8gaXMgZm9yXHJcbiAgICAvLyAnc2VsZWN0IG1vZGUnXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdNb2RlbC5pc1NlbGVjdGlvbk1vZGUsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24gKGl0SXMpIHtcclxuICAgICAgICAgICAgLy8gV2UgaGF2ZSBhIHJlcXVlc3QgYW5kXHJcbiAgICAgICAgICAgIC8vIGl0IHJlcXVlc3RlZCB0byBzZWxlY3QgYSBsb2NhdGlvblxyXG4gICAgICAgICAgICAvLyBhbmQgc2VsZWN0aW9uIG1vZGUgZ29lcyBvZmZcclxuICAgICAgICAgICAgaWYgKHRoaXMucmVxdWVzdEluZm8gJiZcclxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8uc2VsZWN0TG9jYXRpb24gPT09IHRydWUgJiZcclxuICAgICAgICAgICAgICAgIGl0SXMgPT09IGZhbHNlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUGFzcyB0aGUgc2VsZWN0ZWQgY2xpZW50IGluIHRoZSBpbmZvXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvLnNlbGVjdGVkTG9jYXRpb24gPSB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZExvY2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAvLyBBbmQgZ28gYmFja1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ29CYWNrKHRoaXMucmVxdWVzdEluZm8pO1xyXG4gICAgICAgICAgICAgICAgLy8gTGFzdCwgY2xlYXIgcmVxdWVzdEluZm9cclxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gVGVzdGluZ0RhdGFcclxuICAgIHRoaXMudmlld01vZGVsLmxvY2F0aW9ucyhyZXF1aXJlKCcuLi90ZXN0ZGF0YS9sb2NhdGlvbnMnKS5sb2NhdGlvbnMpO1xyXG59KTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcclxuXHJcbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgb3B0aW9ucyk7XHJcbiAgICBcclxuICAgIGlmIChvcHRpb25zLnNlbGVjdExvY2F0aW9uID09PSB0cnVlKSB7XHJcbiAgICAgICAgdGhpcy52aWV3TW9kZWwuaXNTZWxlY3Rpb25Nb2RlKHRydWUpO1xyXG4gICAgICAgIC8vIHByZXNldDpcclxuICAgICAgICB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZExvY2F0aW9uKG9wdGlvbnMuc2VsZWN0ZWRMb2NhdGlvbik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChvcHRpb25zLnJvdXRlICYmIG9wdGlvbnMucm91dGUuc2VnbWVudHMpIHtcclxuICAgICAgICB2YXIgaWQgPSBvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdO1xyXG4gICAgICAgIGlmIChpZCkge1xyXG4gICAgICAgICAgICBpZiAoaWQgPT09ICduZXcnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5zaGVsbC5nbygnbG9jYXRpb25FZGl0aW9uJywge1xyXG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZTogb3B0aW9ucy5yb3V0ZS5zZWdtZW50c1sxXSAvLyAnc2VydmljZVJhZGl1cycsICdzZXJ2aWNlTG9jYXRpb24nXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvKCdsb2NhdGlvbkVkaXRpb24nLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb25JRDogaWRcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKGFwcCkge1xyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJ0xvY2F0aW9ucycpO1xyXG5cclxuICAgIC8vIEZ1bGwgbGlzdCBvZiBsb2NhdGlvbnNcclxuICAgIHRoaXMubG9jYXRpb25zID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcclxuXHJcbiAgICAvLyBFc3BlY2lhbCBtb2RlIHdoZW4gaW5zdGVhZCBvZiBwaWNrIGFuZCBlZGl0IHdlIGFyZSBqdXN0IHNlbGVjdGluZ1xyXG4gICAgLy8gKHdoZW4gZWRpdGluZyBhbiBhcHBvaW50bWVudClcclxuICAgIHRoaXMuaXNTZWxlY3Rpb25Nb2RlID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcblxyXG4gICAgdGhpcy5zZWxlY3RlZExvY2F0aW9uID0ga28ub2JzZXJ2YWJsZShudWxsKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZWxlY3RMb2NhdGlvbiA9IGZ1bmN0aW9uKHNlbGVjdGVkTG9jYXRpb24pIHtcclxuICAgICAgICBcclxuICAgICAgICBpZiAodGhpcy5pc1NlbGVjdGlvbk1vZGUoKSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkTG9jYXRpb24oc2VsZWN0ZWRMb2NhdGlvbik7XHJcbiAgICAgICAgICAgIHRoaXMuaXNTZWxlY3Rpb25Nb2RlKGZhbHNlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGFwcC5zaGVsbC5nbygnbG9jYXRpb25FZGl0aW9uJywge1xyXG4gICAgICAgICAgICAgICAgbG9jYXRpb25JRDogc2VsZWN0ZWRMb2NhdGlvbi5sb2NhdGlvbklEKClcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0uYmluZCh0aGlzKTtcclxufVxyXG4iLCIvKipcbiAgICBMb2dpbiBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXG4gICAgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBMb2dpbkFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuQW5vbnltb3VzO1xuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKCdMb2cgaW4nKTtcbiAgICBcbiAgICAvLyBQZXJmb3JtIGxvZy1pbiByZXF1ZXN0IHdoZW4gaXMgcmVxdWVzdGVkIGJ5IHRoZSBmb3JtOlxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdNb2RlbC5pc0xvZ2luZ0luLFxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgICBpZiAodiA9PT0gdHJ1ZSkge1xuXG4gICAgICAgICAgICAgICAgLy8gUGVyZm9ybSBsb2dpbmdcblxuICAgICAgICAgICAgICAgIC8vIE5vdGlmeSBzdGF0ZTpcbiAgICAgICAgICAgICAgICB2YXIgJGJ0biA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJ1t0eXBlPVwic3VibWl0XCJdJyk7XG4gICAgICAgICAgICAgICAgJGJ0bi5idXR0b24oJ2xvYWRpbmcnKTtcblxuICAgICAgICAgICAgICAgIC8vIENsZWFyIHByZXZpb3VzIGVycm9yIHNvIG1ha2VzIGNsZWFyIHdlXG4gICAgICAgICAgICAgICAgLy8gYXJlIGF0dGVtcHRpbmdcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5sb2dpbkVycm9yKCcnKTtcblxuICAgICAgICAgICAgICAgIHZhciBlbmRlZCA9IGZ1bmN0aW9uIGVuZGVkKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5pc0xvZ2luZ0luKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgJGJ0bi5idXR0b24oJ3Jlc2V0Jyk7XG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICAgICAgLy8gQWZ0ZXIgY2xlYW4tdXAgZXJyb3IgKHRvIGZvcmNlIHNvbWUgdmlldyB1cGRhdGVzKSxcbiAgICAgICAgICAgICAgICAvLyB2YWxpZGF0ZSBhbmQgYWJvcnQgb24gZXJyb3JcbiAgICAgICAgICAgICAgICAvLyBNYW51YWxseSBjaGVja2luZyBlcnJvciBvbiBlYWNoIGZpZWxkXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudmlld01vZGVsLnVzZXJuYW1lLmVycm9yKCkgfHxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwucGFzc3dvcmQuZXJyb3IoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5sb2dpbkVycm9yKCdSZXZpZXcgeW91ciBkYXRhJyk7XG4gICAgICAgICAgICAgICAgICAgIGVuZGVkKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5tb2RlbC5sb2dpbihcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwudXNlcm5hbWUoKSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwucGFzc3dvcmQoKVxuICAgICAgICAgICAgICAgICkudGhlbihmdW5jdGlvbigvKmxvZ2luRGF0YSovKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwubG9naW5FcnJvcignJyk7XG4gICAgICAgICAgICAgICAgICAgIGVuZGVkKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGZvcm0gZGF0YVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC51c2VybmFtZSgnJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnBhc3N3b3JkKCcnKTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcC5nb0Rhc2hib2FyZCgpO1xuXG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKS5jYXRjaChmdW5jdGlvbihlcnIpIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgbXNnID0gZXJyICYmIGVyci5yZXNwb25zZUpTT04gJiYgZXJyLnJlc3BvbnNlSlNPTi5lcnJvck1lc3NhZ2UgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVyciAmJiBlcnIuc3RhdHVzVGV4dCB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0ludmFsaWQgdXNlcm5hbWUgb3IgcGFzc3dvcmQnO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmxvZ2luRXJyb3IobXNnKTtcbiAgICAgICAgICAgICAgICAgICAgZW5kZWQoKTtcbiAgICAgICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcylcbiAgICB9KTtcbiAgICBcbiAgICAvLyBGb2N1cyBmaXJzdCBiYWQgZmllbGQgb24gZXJyb3JcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwubG9naW5FcnJvcixcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAvLyBMb2dpbiBpcyBlYXN5IHNpbmNlIHdlIG1hcmsgYm90aCB1bmlxdWUgZmllbGRzXG4gICAgICAgICAgICAvLyBhcyBlcnJvciBvbiBsb2dpbkVycm9yIChpdHMgYSBnZW5lcmFsIGZvcm0gZXJyb3IpXG4gICAgICAgICAgICB2YXIgaW5wdXQgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCc6aW5wdXQnKS5nZXQoMCk7XG4gICAgICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgICAgIGlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaW5wdXQuYmx1cigpO1xuICAgICAgICB9LmJpbmQodGhpcylcbiAgICB9KTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbnZhciBGb3JtQ3JlZGVudGlhbHMgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL0Zvcm1DcmVkZW50aWFscycpO1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG5cbiAgICB2YXIgY3JlZGVudGlhbHMgPSBuZXcgRm9ybUNyZWRlbnRpYWxzKCk7ICAgIFxuICAgIHRoaXMudXNlcm5hbWUgPSBjcmVkZW50aWFscy51c2VybmFtZTtcbiAgICB0aGlzLnBhc3N3b3JkID0gY3JlZGVudGlhbHMucGFzc3dvcmQ7XG5cbiAgICB0aGlzLmxvZ2luRXJyb3IgPSBrby5vYnNlcnZhYmxlKCcnKTtcbiAgICBcbiAgICB0aGlzLmlzTG9naW5nSW4gPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcbiAgICBcbiAgICB0aGlzLnBlcmZvcm1Mb2dpbiA9IGZ1bmN0aW9uIHBlcmZvcm1Mb2dpbigpIHtcblxuICAgICAgICB0aGlzLmlzTG9naW5nSW4odHJ1ZSk7ICAgICAgICBcbiAgICB9LmJpbmQodGhpcyk7XG59XG4iLCIvKipcbiAgICBMb2dvdXQgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBMb2dvdXRBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhzdGF0ZSkge1xuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xuICAgIFxuICAgIHRoaXMuYXBwLm1vZGVsLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIEFub255bW91cyB1c2VyIGFnYWluXG4gICAgICAgIHZhciBuZXdBbm9uID0gdGhpcy5hcHAubW9kZWwudXNlcigpLmNvbnN0cnVjdG9yLm5ld0Fub255bW91cygpO1xuICAgICAgICB0aGlzLmFwcC5tb2RlbC51c2VyKCkubW9kZWwudXBkYXRlV2l0aChuZXdBbm9uKTtcblxuICAgICAgICAvLyBHbyBpbmRleFxuICAgICAgICB0aGlzLmFwcC5zaGVsbC5nbygnLycpO1xuICAgICAgICBcbiAgICB9LmJpbmQodGhpcykpO1xufTtcbiIsIi8qKlxuICAgIE9uYm9hcmRpbmdDb21wbGV0ZSBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIE9uYm9hcmRpbmdDb21wbGV0ZUFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIobnVsbCk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuIiwiLyoqXG4gICAgT25ib2FyZGluZ0hvbWUgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBPbmJvYXJkaW5nSG9tZUFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICAvLyBudWxsIGZvciBMb2dvXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKG51bGwpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcbiIsIi8qKlxuICAgIE9uYm9hcmRpbmcgUG9zaXRpb25zIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcbiAgICBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIE9uYm9hcmRpbmdQb3NpdGlvbnNBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkZyZWVsYW5jZXI7XG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIoJ0pvYiBUaXRsZXMnKTtcblxuICAgIC8vIFRlc3RpbmdEYXRhXG4gICAgc2V0U29tZVRlc3RpbmdEYXRhKHRoaXMudmlld01vZGVsKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcblxuICAgIC8vIEZ1bGwgbGlzdCBvZiBwb3NpdGlvbnNcbiAgICB0aGlzLnBvc2l0aW9ucyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XG59XG5cbnZhciBQb3NpdGlvbiA9IHJlcXVpcmUoJy4uL21vZGVscy9Qb3NpdGlvbicpO1xuLy8gVXNlclBvc2l0aW9uIG1vZGVsXG5mdW5jdGlvbiBzZXRTb21lVGVzdGluZ0RhdGEodmlld01vZGVsKSB7XG4gICAgXG4gICAgdmlld01vZGVsLnBvc2l0aW9ucy5wdXNoKG5ldyBQb3NpdGlvbih7XG4gICAgICAgIHBvc2l0aW9uU2luZ3VsYXI6ICdNYXNzYWdlIFRoZXJhcGlzdCdcbiAgICB9KSk7XG4gICAgdmlld01vZGVsLnBvc2l0aW9ucy5wdXNoKG5ldyBQb3NpdGlvbih7XG4gICAgICAgIHBvc2l0aW9uU2luZ3VsYXI6ICdIb3VzZWtlZXBlcidcbiAgICB9KSk7XG59IiwiLyoqXG4gICAgT3duZXJJbmZvIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gT3duZXJJbmZvQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignQWNjb3VudCcpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcbiIsIi8qKlxyXG4gICAgUHJpdmFjeVNldHRpbmdzIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcblxyXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gUHJpdmFjeVNldHRpbmdzQWN0aXZpdHkoKSB7XHJcbiAgICBcclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICBcclxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcclxuXHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ0FjY291bnQnKTtcclxuICAgIFxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy5hcHAubW9kZWwucHJpdmFjeVNldHRpbmdzLFxyXG4gICAgICAgIGV2ZW50OiAnZXJyb3InLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICB2YXIgbXNnID0gZXJyLnRhc2sgPT09ICdzYXZlJyA/ICdFcnJvciBzYXZpbmcgcHJpdmFjeSBzZXR0aW5ncy4nIDogJ0Vycm9yIGxvYWRpbmcgcHJpdmFjeSBzZXR0aW5ncy4nO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5tb2RhbHMuc2hvd0Vycm9yKHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBtc2csXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyICYmIGVyci50YXNrICYmIGVyci5lcnJvciB8fCBlcnJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhzdGF0ZSkge1xyXG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBzdGF0ZSk7XHJcbiAgICBcclxuICAgICAgICAvLyBLZWVwIGRhdGEgdXBkYXRlZDpcclxuICAgIHRoaXMuYXBwLm1vZGVsLnByaXZhY3lTZXR0aW5ncy5zeW5jKCk7XHJcbiAgICAvLyBEaXNjYXJkIGFueSBwcmV2aW91cyB1bnNhdmVkIGVkaXRcclxuICAgIHRoaXMudmlld01vZGVsLmRpc2NhcmQoKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbChhcHApIHtcclxuXHJcbiAgICB2YXIgcHJpdmFjeVNldHRpbmdzID0gYXBwLm1vZGVsLnByaXZhY3lTZXR0aW5ncztcclxuXHJcbiAgICB2YXIgc2V0dGluZ3NWZXJzaW9uID0gcHJpdmFjeVNldHRpbmdzLm5ld1ZlcnNpb24oKTtcclxuICAgIHNldHRpbmdzVmVyc2lvbi5pc09ic29sZXRlLnN1YnNjcmliZShmdW5jdGlvbihpdElzKSB7XHJcbiAgICAgICAgaWYgKGl0SXMpIHtcclxuICAgICAgICAgICAgLy8gbmV3IHZlcnNpb24gZnJvbSBzZXJ2ZXIgd2hpbGUgZWRpdGluZ1xyXG4gICAgICAgICAgICAvLyBGVVRVUkU6IHdhcm4gYWJvdXQgYSBuZXcgcmVtb3RlIHZlcnNpb24gYXNraW5nXHJcbiAgICAgICAgICAgIC8vIGNvbmZpcm1hdGlvbiB0byBsb2FkIHRoZW0gb3IgZGlzY2FyZCBhbmQgb3ZlcndyaXRlIHRoZW07XHJcbiAgICAgICAgICAgIC8vIHRoZSBzYW1lIGlzIG5lZWQgb24gc2F2ZSgpLCBhbmQgb24gc2VydmVyIHJlc3BvbnNlXHJcbiAgICAgICAgICAgIC8vIHdpdGggYSA1MDk6Q29uZmxpY3Qgc3RhdHVzIChpdHMgYm9keSBtdXN0IGNvbnRhaW4gdGhlXHJcbiAgICAgICAgICAgIC8vIHNlcnZlciB2ZXJzaW9uKS5cclxuICAgICAgICAgICAgLy8gUmlnaHQgbm93LCBqdXN0IG92ZXJ3cml0ZSBjdXJyZW50IGNoYW5nZXMgd2l0aFxyXG4gICAgICAgICAgICAvLyByZW1vdGUgb25lczpcclxuICAgICAgICAgICAgc2V0dGluZ3NWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gQWN0dWFsIGRhdGEgZm9yIHRoZSBmb3JtOlxyXG4gICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzVmVyc2lvbi52ZXJzaW9uO1xyXG5cclxuICAgIHRoaXMuaXNMb2NrZWQgPSBwcml2YWN5U2V0dGluZ3MuaXNMb2NrZWQ7XHJcblxyXG4gICAgdGhpcy5zdWJtaXRUZXh0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKCkgPyBcclxuICAgICAgICAgICAgICAgICdsb2FkaW5nLi4uJyA6IFxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc1NhdmluZygpID8gXHJcbiAgICAgICAgICAgICAgICAgICAgJ3NhdmluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgICAgICAnU2F2ZSdcclxuICAgICAgICApO1xyXG4gICAgfSwgcHJpdmFjeVNldHRpbmdzKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNjYXJkID0gZnVuY3Rpb24gZGlzY2FyZCgpIHtcclxuICAgICAgICBzZXR0aW5nc1ZlcnNpb24ucHVsbCh7IGV2ZW5JZk5ld2VyOiB0cnVlIH0pO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG5cclxuICAgIHRoaXMuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICAgICAgLy8gRm9yY2UgdG8gc2F2ZSwgZXZlbiBpZiB0aGVyZSB3YXMgcmVtb3RlIHVwZGF0ZXNcclxuICAgICAgICBzZXR0aW5nc1ZlcnNpb24ucHVzaCh7IGV2ZW5JZk9ic29sZXRlOiB0cnVlIH0pO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG59XHJcbiIsIi8qKlxuICAgIFNjaGVkdWxpbmcgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5JyksXG4gICAgVXNlckpvYlByb2ZpbGVWaWV3TW9kZWwgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL1VzZXJKb2JQcm9maWxlJyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBTY2hlZHVsaW5nQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFVzZXJKb2JQcm9maWxlVmlld01vZGVsKHRoaXMuYXBwKTtcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIoJ1NjaGVkdWxpbmcnKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KHN0YXRlKSB7XG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBzdGF0ZSk7XG5cbiAgICB0aGlzLnZpZXdNb2RlbC5zeW5jKCk7XG59O1xuIiwiLyoqXHJcbiAgICBTY2hlZHVsaW5nUHJlZmVyZW5jZXMgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIFNjaGVkdWxpbmdQcmVmZXJlbmNlc0FjdGl2aXR5KCkge1xyXG4gICAgXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkZyZWVsYW5jZXI7XHJcblxyXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdTY2hlZHVsaW5nJyk7XHJcbiAgICBcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMuYXBwLm1vZGVsLnNjaGVkdWxpbmdQcmVmZXJlbmNlcyxcclxuICAgICAgICBldmVudDogJ2Vycm9yJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgdmFyIG1zZyA9IGVyci50YXNrID09PSAnc2F2ZScgPyAnRXJyb3Igc2F2aW5nIHNjaGVkdWxpbmcgcHJlZmVyZW5jZXMuJyA6ICdFcnJvciBsb2FkaW5nIHNjaGVkdWxpbmcgcHJlZmVyZW5jZXMuJztcclxuICAgICAgICAgICAgdGhpcy5hcHAubW9kYWxzLnNob3dFcnJvcih7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogbXNnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVyciAmJiBlcnIudGFzayAmJiBlcnIuZXJyb3IgfHwgZXJyXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xyXG4gICAgXHJcbiAgICAgICAgLy8gS2VlcCBkYXRhIHVwZGF0ZWQ6XHJcbiAgICB0aGlzLmFwcC5tb2RlbC5zY2hlZHVsaW5nUHJlZmVyZW5jZXMuc3luYygpO1xyXG4gICAgLy8gRGlzY2FyZCBhbnkgcHJldmlvdXMgdW5zYXZlZCBlZGl0XHJcbiAgICB0aGlzLnZpZXdNb2RlbC5kaXNjYXJkKCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoYXBwKSB7XHJcblxyXG4gICAgdmFyIHNjaGVkdWxpbmdQcmVmZXJlbmNlcyA9IGFwcC5tb2RlbC5zY2hlZHVsaW5nUHJlZmVyZW5jZXM7XHJcblxyXG4gICAgdmFyIHByZWZzVmVyc2lvbiA9IHNjaGVkdWxpbmdQcmVmZXJlbmNlcy5uZXdWZXJzaW9uKCk7XHJcbiAgICBwcmVmc1ZlcnNpb24uaXNPYnNvbGV0ZS5zdWJzY3JpYmUoZnVuY3Rpb24oaXRJcykge1xyXG4gICAgICAgIGlmIChpdElzKSB7XHJcbiAgICAgICAgICAgIC8vIG5ldyB2ZXJzaW9uIGZyb20gc2VydmVyIHdoaWxlIGVkaXRpbmdcclxuICAgICAgICAgICAgLy8gRlVUVVJFOiB3YXJuIGFib3V0IGEgbmV3IHJlbW90ZSB2ZXJzaW9uIGFza2luZ1xyXG4gICAgICAgICAgICAvLyBjb25maXJtYXRpb24gdG8gbG9hZCB0aGVtIG9yIGRpc2NhcmQgYW5kIG92ZXJ3cml0ZSB0aGVtO1xyXG4gICAgICAgICAgICAvLyB0aGUgc2FtZSBpcyBuZWVkIG9uIHNhdmUoKSwgYW5kIG9uIHNlcnZlciByZXNwb25zZVxyXG4gICAgICAgICAgICAvLyB3aXRoIGEgNTA5OkNvbmZsaWN0IHN0YXR1cyAoaXRzIGJvZHkgbXVzdCBjb250YWluIHRoZVxyXG4gICAgICAgICAgICAvLyBzZXJ2ZXIgdmVyc2lvbikuXHJcbiAgICAgICAgICAgIC8vIFJpZ2h0IG5vdywganVzdCBvdmVyd3JpdGUgY3VycmVudCBjaGFuZ2VzIHdpdGhcclxuICAgICAgICAgICAgLy8gcmVtb3RlIG9uZXM6XHJcbiAgICAgICAgICAgIHByZWZzVmVyc2lvbi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEFjdHVhbCBkYXRhIGZvciB0aGUgZm9ybTpcclxuICAgIHRoaXMucHJlZnMgPSBwcmVmc1ZlcnNpb24udmVyc2lvbjtcclxuXHJcbiAgICB0aGlzLmlzTG9ja2VkID0gc2NoZWR1bGluZ1ByZWZlcmVuY2VzLmlzTG9ja2VkO1xyXG5cclxuICAgIHRoaXMuc3VibWl0VGV4dCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZygpID8gXHJcbiAgICAgICAgICAgICAgICAnbG9hZGluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNTYXZpbmcoKSA/IFxyXG4gICAgICAgICAgICAgICAgICAgICdzYXZpbmcuLi4nIDogXHJcbiAgICAgICAgICAgICAgICAgICAgJ1NhdmUnXHJcbiAgICAgICAgKTtcclxuICAgIH0sIHNjaGVkdWxpbmdQcmVmZXJlbmNlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzY2FyZCA9IGZ1bmN0aW9uIGRpc2NhcmQoKSB7XHJcbiAgICAgICAgcHJlZnNWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgICAgIC8vIEZvcmNlIHRvIHNhdmUsIGV2ZW4gaWYgdGhlcmUgd2FzIHJlbW90ZSB1cGRhdGVzXHJcbiAgICAgICAgcHJlZnNWZXJzaW9uLnB1c2goeyBldmVuSWZPYnNvbGV0ZTogdHJ1ZSB9KTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5pbmNyZW1lbnRzRXhhbXBsZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgc3RyID0gJ2UuZy4gJyxcclxuICAgICAgICAgICAgaW5jU2l6ZSA9IHRoaXMuaW5jcmVtZW50c1NpemVJbk1pbnV0ZXMoKSxcclxuICAgICAgICAgICAgbSA9IG1vbWVudCh7IGhvdXI6IDEwLCBtaW51dGU6IDAgfSksXHJcbiAgICAgICAgICAgIGhvdXJzID0gW20uZm9ybWF0KCdISDptbScpXTtcclxuICAgICAgICBcclxuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IDQ7IGkrKykge1xyXG4gICAgICAgICAgICBob3Vycy5wdXNoKFxyXG4gICAgICAgICAgICAgICAgbS5hZGQoaW5jU2l6ZSwgJ21pbnV0ZXMnKVxyXG4gICAgICAgICAgICAgICAgLmZvcm1hdCgnSEg6bW0nKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdHIgKz0gaG91cnMuam9pbignLCAnKTtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gc3RyO1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcy5wcmVmcyk7XHJcbn1cclxuIiwiLyoqXHJcbiAgICBzZXJ2aWNlcyBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG4gICAgXHJcbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBTZXJ2aWNlc0FjdGl2aXR5KCkge1xyXG5cclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICBcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5GcmVsYW5jZXI7XHJcbiAgICBcclxuICAgIC8vIFRPRE86IG9uIHNob3csIG5lZWQgdG8gYmUgdXBkYXRlZCB3aXRoIHRoZSBKb2JUaXRsZSBuYW1lXHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ0pvYiB0aXRsZScpO1xyXG4gICAgXHJcbiAgICAvL3RoaXMuJGxpc3RWaWV3ID0gdGhpcy4kYWN0aXZpdHkuZmluZCgnI3NlcnZpY2VzTGlzdFZpZXcnKTtcclxuXHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcclxuXHJcbiAgICAvLyBUZXN0aW5nRGF0YVxyXG4gICAgdGhpcy52aWV3TW9kZWwuc2VydmljZXMocmVxdWlyZSgnLi4vdGVzdGRhdGEvc2VydmljZXMnKS5zZXJ2aWNlcy5tYXAoU2VsZWN0YWJsZSkpO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyIHRvIGdvIGJhY2sgd2l0aCB0aGUgc2VsZWN0ZWQgc2VydmljZSB3aGVuIFxyXG4gICAgLy8gc2VsZWN0aW9uIG1vZGUgZ29lcyBvZmYgYW5kIHJlcXVlc3REYXRhIGlzIGZvclxyXG4gICAgLy8gJ3NlbGVjdCBtb2RlJ1xyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwuaXNTZWxlY3Rpb25Nb2RlLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uIChpdElzKSB7XHJcbiAgICAgICAgICAgIC8vIFdlIGhhdmUgYSByZXF1ZXN0IGFuZFxyXG4gICAgICAgICAgICAvLyBpdCByZXF1ZXN0ZWQgdG8gc2VsZWN0IGEgc2VydmljZVxyXG4gICAgICAgICAgICAvLyBhbmQgc2VsZWN0aW9uIG1vZGUgZ29lcyBvZmZcclxuICAgICAgICAgICAgaWYgKHRoaXMucmVxdWVzdERhdGEgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdERhdGEuc2VsZWN0U2VydmljZXMgPT09IHRydWUgJiZcclxuICAgICAgICAgICAgICAgIGl0SXMgPT09IGZhbHNlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUGFzcyB0aGUgc2VsZWN0ZWQgY2xpZW50IGluIHRoZSBpbmZvXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3REYXRhLnNlbGVjdGVkU2VydmljZXMgPSB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZFNlcnZpY2VzKCk7XHJcbiAgICAgICAgICAgICAgICAvLyBBbmQgZ28gYmFja1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ29CYWNrKHRoaXMucmVxdWVzdERhdGEpO1xyXG4gICAgICAgICAgICAgICAgLy8gTGFzdCwgY2xlYXIgcmVxdWVzdERhdGFcclxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdERhdGEgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG5cclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgb3B0aW9ucyk7XHJcbiAgICBcclxuICAgIC8vIEdldCBqb2J0aXRsZUlEIGZvciB0aGUgcmVxdWVzdFxyXG4gICAgdmFyIHJvdXRlID0gdGhpcy5yZXF1ZXN0RGF0YSAmJiB0aGlzLnJlcXVlc3REYXRhLnJvdXRlO1xyXG4gICAgdmFyIGpvYlRpdGxlSUQgPSByb3V0ZSAmJiByb3V0ZS5zZWdtZW50cyAmJiByb3V0ZS5zZWdtZW50c1swXTtcclxuICAgIGpvYlRpdGxlSUQgPSBwYXJzZUludChqb2JUaXRsZUlELCAxMCk7XHJcbiAgICBpZiAoam9iVGl0bGVJRCkge1xyXG4gICAgICAgIC8vIFRPRE86IGdldCBkYXRhIGZvciB0aGUgSm9iIHRpdGxlIElEXHJcbiAgICAgICAgY29uc29sZS5sb2coJ2pvYlRpdGxlSUQnLCBqb2JUaXRsZUlEKTtcclxuICAgICAgICB0aGlzLmFwcC5tb2RlbC51c2VySm9iUHJvZmlsZS5nZXRVc2VySm9iVGl0bGUoam9iVGl0bGVJRCkudGhlbihmdW5jdGlvbih1c2VySm9idGl0bGUpIHtcclxuICAgICAgICAgICAgaWYgKCF1c2VySm9idGl0bGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdObyB1c2VyIGpvYiB0aXRsZScpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIEZpbGwgaW4gam9iIHRpdGxlIG5hbWVcclxuICAgICAgICAgICAgdGhpcy5hcHAubW9kZWwuZ2V0Sm9iVGl0bGUoam9iVGl0bGVJRCkudGhlbihmdW5jdGlvbihqb2JUaXRsZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFqb2JUaXRsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdObyBqb2IgdGl0bGUnKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5hdkJhci5sZWZ0QWN0aW9uKCkudGV4dChqb2JUaXRsZS5zaW5ndWxhck5hbWUoKSk7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBUT0RPIExvYWQgam9iIHRpdGxlIHByaWNpbmcgb24gdGhpcyBhY3Rpdml0eTpcclxuICAgICAgICAgICAgLy90aGlzLnZpZXdNb2RlbC5zZXJ2aWNlcyh1c2VySm9idGl0bGUuc2VydmljZXMoKSk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdKb2IgVGl0bGUgUHJpY2luZy9TZXJ2aWNlcyBsb2FkIG5vdCBzdXBwb3J0ZWQgc3RpbGwnKTtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLnJlcXVlc3REYXRhLnNlbGVjdFNlcnZpY2VzID09PSB0cnVlKSB7XHJcbiAgICAgICAgdGhpcy52aWV3TW9kZWwuaXNTZWxlY3Rpb25Nb2RlKHRydWUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8qIFRyaWFscyB0byBwcmVzZXRzIHRoZSBzZWxlY3RlZCBzZXJ2aWNlcywgTk9UIFdPUktJTkdcclxuICAgICAgICB2YXIgc2VydmljZXMgPSAob3B0aW9ucy5zZWxlY3RlZFNlcnZpY2VzIHx8IFtdKTtcclxuICAgICAgICB2YXIgc2VsZWN0ZWRTZXJ2aWNlcyA9IHRoaXMudmlld01vZGVsLnNlbGVjdGVkU2VydmljZXM7XHJcbiAgICAgICAgc2VsZWN0ZWRTZXJ2aWNlcy5yZW1vdmVBbGwoKTtcclxuICAgICAgICB0aGlzLnZpZXdNb2RlbC5zZXJ2aWNlcygpLmZvckVhY2goZnVuY3Rpb24oc2VydmljZSkge1xyXG4gICAgICAgICAgICBzZXJ2aWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHNlbFNlcnZpY2UpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzZWxTZXJ2aWNlID09PSBzZXJ2aWNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VydmljZS5pc1NlbGVjdGVkKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkU2VydmljZXMucHVzaChzZXJ2aWNlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VydmljZS5pc1NlbGVjdGVkKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgKi9cclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIFNlbGVjdGFibGUob2JqKSB7XHJcbiAgICBvYmouaXNTZWxlY3RlZCA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgcmV0dXJuIG9iajtcclxufVxyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIC8vIEZ1bGwgbGlzdCBvZiBzZXJ2aWNlc1xyXG4gICAgdGhpcy5zZXJ2aWNlcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcblxyXG4gICAgLy8gRXNwZWNpYWwgbW9kZSB3aGVuIGluc3RlYWQgb2YgcGljayBhbmQgZWRpdCB3ZSBhcmUganVzdCBzZWxlY3RpbmdcclxuICAgIC8vICh3aGVuIGVkaXRpbmcgYW4gYXBwb2ludG1lbnQpXHJcbiAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZSA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG5cclxuICAgIC8vIEdyb3VwZWQgbGlzdCBvZiBwcmljaW5nczpcclxuICAgIC8vIERlZmluZWQgZ3JvdXBzOiByZWd1bGFyIHNlcnZpY2VzIGFuZCBhZGQtb25zXHJcbiAgICB0aGlzLmdyb3VwZWRTZXJ2aWNlcyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIHZhciBzZXJ2aWNlcyA9IHRoaXMuc2VydmljZXMoKTtcclxuICAgICAgICB2YXIgaXNTZWxlY3Rpb24gPSB0aGlzLmlzU2VsZWN0aW9uTW9kZSgpO1xyXG5cclxuICAgICAgICB2YXIgc2VydmljZXNHcm91cCA9IHtcclxuICAgICAgICAgICAgICAgIGdyb3VwOiBpc1NlbGVjdGlvbiA/ICdTZWxlY3Qgc3RhbmRhbG9uZSBzZXJ2aWNlcycgOiAnU3RhbmRhbG9uZSBzZXJ2aWNlcycsXHJcbiAgICAgICAgICAgICAgICBzZXJ2aWNlczogW11cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYWRkb25zR3JvdXAgPSB7XHJcbiAgICAgICAgICAgICAgICBncm91cDogaXNTZWxlY3Rpb24gPyAnU2VsZWN0IGFkZC1vbiBzZXJ2aWNlcycgOiAnQWRkLW9uIHNlcnZpY2VzJyxcclxuICAgICAgICAgICAgICAgIHNlcnZpY2VzOiBbXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBncm91cHMgPSBbc2VydmljZXNHcm91cCwgYWRkb25zR3JvdXBdO1xyXG5cclxuICAgICAgICBzZXJ2aWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBpc0FkZG9uID0gc2VydmljZS5pc0FkZG9uKCk7XHJcbiAgICAgICAgICAgIGlmIChpc0FkZG9uKSB7XHJcbiAgICAgICAgICAgICAgICBhZGRvbnNHcm91cC5zZXJ2aWNlcy5wdXNoKHNlcnZpY2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2VydmljZXNHcm91cC5zZXJ2aWNlcy5wdXNoKHNlcnZpY2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBncm91cHM7XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2VsZWN0ZWRTZXJ2aWNlcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcbiAgICAvKipcclxuICAgICAgICBUb2dnbGUgdGhlIHNlbGVjdGlvbiBzdGF0dXMgb2YgYSBzZXJ2aWNlLCBhZGRpbmdcclxuICAgICAgICBvciByZW1vdmluZyBpdCBmcm9tIHRoZSAnc2VsZWN0ZWRTZXJ2aWNlcycgYXJyYXkuXHJcbiAgICAqKi9cclxuICAgIHRoaXMudG9nZ2xlU2VydmljZVNlbGVjdGlvbiA9IGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgaW5JbmRleCA9IC0xLFxyXG4gICAgICAgICAgICBpc1NlbGVjdGVkID0gdGhpcy5zZWxlY3RlZFNlcnZpY2VzKCkuc29tZShmdW5jdGlvbihzZWxlY3RlZFNlcnZpY2UsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RlZFNlcnZpY2UgPT09IHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgICAgIGluSW5kZXggPSBpbmRleDtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2VydmljZS5pc1NlbGVjdGVkKCFpc1NlbGVjdGVkKTtcclxuXHJcbiAgICAgICAgaWYgKGlzU2VsZWN0ZWQpXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRTZXJ2aWNlcy5zcGxpY2UoaW5JbmRleCwgMSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkU2VydmljZXMucHVzaChzZXJ2aWNlKTtcclxuXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEVuZHMgdGhlIHNlbGVjdGlvbiBwcm9jZXNzLCByZWFkeSB0byBjb2xsZWN0IHNlbGVjdGlvblxyXG4gICAgICAgIGFuZCBwYXNzaW5nIGl0IHRvIHRoZSByZXF1ZXN0IGFjdGl2aXR5XHJcbiAgICAqKi9cclxuICAgIHRoaXMuZW5kU2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5pc1NlbGVjdGlvbk1vZGUoZmFsc2UpO1xyXG4gICAgICAgIFxyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG59XHJcbiIsIi8qKlxuICAgIFNpZ251cCBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXG4gICAgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBTaWdudXBBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkFub255bW91cztcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xuICAgIC8vIG51bGwgZm9yIExvZ29cbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIobnVsbCk7XG4gICAgXG4gICAgLy8gUGVyZm9ybSBzaWduLXVwIHJlcXVlc3Qgd2hlbiBpcyByZXF1ZXN0ZWQgYnkgdGhlIGZvcm06XG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLmlzU2lnbmluZ1VwLFxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgICBpZiAodiA9PT0gdHJ1ZSkge1xuXG4gICAgICAgICAgICAgICAgLy8gUGVyZm9ybSBzaWdudXBcblxuICAgICAgICAgICAgICAgIC8vIE5vdGlmeSBzdGF0ZTpcbiAgICAgICAgICAgICAgICB2YXIgJGJ0biA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJ1t0eXBlPVwic3VibWl0XCJdJyk7XG4gICAgICAgICAgICAgICAgJGJ0bi5idXR0b24oJ2xvYWRpbmcnKTtcblxuICAgICAgICAgICAgICAgIC8vIENsZWFyIHByZXZpb3VzIGVycm9yIHNvIG1ha2VzIGNsZWFyIHdlXG4gICAgICAgICAgICAgICAgLy8gYXJlIGF0dGVtcHRpbmdcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5zaWdudXBFcnJvcignJyk7XG5cbiAgICAgICAgICAgICAgICB2YXIgZW5kZWQgPSBmdW5jdGlvbiBlbmRlZCgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuaXNTaWduaW5nVXAoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAkYnRuLmJ1dHRvbigncmVzZXQnKTtcbiAgICAgICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgICAgICAvLyBBZnRlciBjbGVhbi11cCBlcnJvciAodG8gZm9yY2Ugc29tZSB2aWV3IHVwZGF0ZXMpLFxuICAgICAgICAgICAgICAgIC8vIHZhbGlkYXRlIGFuZCBhYm9ydCBvbiBlcnJvclxuICAgICAgICAgICAgICAgIC8vIE1hbnVhbGx5IGNoZWNraW5nIGVycm9yIG9uIGVhY2ggZmllbGRcbiAgICAgICAgICAgICAgICBpZiAodGhpcy52aWV3TW9kZWwudXNlcm5hbWUuZXJyb3IoKSB8fFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5wYXNzd29yZC5lcnJvcigpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnNpZ251cEVycm9yKCdSZXZpZXcgeW91ciBkYXRhJyk7XG4gICAgICAgICAgICAgICAgICAgIGVuZGVkKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5tb2RlbC5zaWdudXAoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnVzZXJuYW1lKCksXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnBhc3N3b3JkKCksXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnByb2ZpbGUoKVxuICAgICAgICAgICAgICAgICkudGhlbihmdW5jdGlvbigvKnNpZ251cERhdGEqLykge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnNpZ251cEVycm9yKCcnKTtcbiAgICAgICAgICAgICAgICAgICAgZW5kZWQoKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgZm9ybSBkYXRhXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnVzZXJuYW1lKCcnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwucGFzc3dvcmQoJycpO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwLmdvRGFzaGJvYXJkKCk7XG5cbiAgICAgICAgICAgICAgICB9LmJpbmQodGhpcykpLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBtc2cgPSBlcnIgJiYgZXJyLnJlc3BvbnNlSlNPTiAmJiBlcnIucmVzcG9uc2VKU09OLmVycm9yTWVzc2FnZSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyICYmIGVyci5zdGF0dXNUZXh0IHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAnSW52YWxpZCB1c2VybmFtZSBvciBwYXNzd29yZCc7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuc2lnbnVwRXJyb3IobXNnKTtcbiAgICAgICAgICAgICAgICAgICAgZW5kZWQoKTtcbiAgICAgICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcylcbiAgICB9KTtcbiAgICBcbiAgICAvLyBGb2N1cyBmaXJzdCBiYWQgZmllbGQgb24gZXJyb3JcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwuc2lnbnVwRXJyb3IsXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgLy8gU2lnbnVwIGlzIGVhc3kgc2luY2Ugd2UgbWFyayBib3RoIHVuaXF1ZSBmaWVsZHNcbiAgICAgICAgICAgIC8vIGFzIGVycm9yIG9uIHNpZ251cEVycm9yIChpdHMgYSBnZW5lcmFsIGZvcm0gZXJyb3IpXG4gICAgICAgICAgICB2YXIgaW5wdXQgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCc6aW5wdXQnKS5nZXQoMCk7XG4gICAgICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgICAgIGlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaW5wdXQuYmx1cigpO1xuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICBcbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnJvdXRlICYmXG4gICAgICAgIG9wdGlvbnMucm91dGUuc2VnbWVudHMgJiZcbiAgICAgICAgb3B0aW9ucy5yb3V0ZS5zZWdtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy52aWV3TW9kZWwucHJvZmlsZShvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdKTtcbiAgICB9XG59O1xuXG5cbnZhciBGb3JtQ3JlZGVudGlhbHMgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL0Zvcm1DcmVkZW50aWFscycpO1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG5cbiAgICB2YXIgY3JlZGVudGlhbHMgPSBuZXcgRm9ybUNyZWRlbnRpYWxzKCk7ICAgIFxuICAgIHRoaXMudXNlcm5hbWUgPSBjcmVkZW50aWFscy51c2VybmFtZTtcbiAgICB0aGlzLnBhc3N3b3JkID0gY3JlZGVudGlhbHMucGFzc3dvcmQ7XG5cbiAgICB0aGlzLnNpZ251cEVycm9yID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgXG4gICAgdGhpcy5pc1NpZ25pbmdVcCA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xuICAgIFxuICAgIHRoaXMucGVyZm9ybVNpZ251cCA9IGZ1bmN0aW9uIHBlcmZvcm1TaWdudXAoKSB7XG5cbiAgICAgICAgdGhpcy5pc1NpZ25pbmdVcCh0cnVlKTtcbiAgICB9LmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLnByb2ZpbGUgPSBrby5vYnNlcnZhYmxlKCdjdXN0b21lcicpO1xufVxuIiwiLyoqXHJcbiAgICB0ZXh0RWRpdG9yIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyLFxyXG4gICAgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XHJcblxyXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gVGV4dEVkaXRvckFjdGl2aXR5KCkge1xyXG4gICAgXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcclxuICAgIC8vIFRpdGxlIGlzIGVtcHR5IGV2ZXIsIHNpbmNlIHdlIGFyZSBpbiAnZ28gYmFjaycgbW9kZSBhbGwgdGhlIHRpbWUgaGVyZVxyXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCcnKTtcclxuICAgIFxyXG4gICAgLy8gR2V0dGluZyBlbGVtZW50c1xyXG4gICAgdGhpcy4kdGV4dGFyZWEgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCd0ZXh0YXJlYScpO1xyXG4gICAgdGhpcy50ZXh0YXJlYSA9IHRoaXMuJHRleHRhcmVhLmdldCgwKTtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciBmb3IgdGhlICdzYXZlZCcgZXZlbnQgc28gdGhlIGFjdGl2aXR5XHJcbiAgICAvLyByZXR1cm5zIGJhY2sgdG8gdGhlIHJlcXVlc3RlciBhY3Rpdml0eSBnaXZpbmcgaXRcclxuICAgIC8vIHRoZSBuZXcgdGV4dFxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwsXHJcbiAgICAgICAgZXZlbnQ6ICdzYXZlZCcsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnJlcXVlc3RJbmZvKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGluZm8gd2l0aCB0aGUgbmV3IHRleHRcclxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8udGV4dCA9IHRoaXMudmlld01vZGVsLnRleHQoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gYW5kIHBhc3MgaXQgYmFja1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5zaGVsbC5nb0JhY2sodGhpcy5yZXF1ZXN0SW5mbyk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciB0aGUgY2FuY2VsIGV2ZW50XHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdNb2RlbCxcclxuICAgICAgICBldmVudDogJ2NhbmNlbCcsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIC8vIHJldHVybiwgbm90aGluZyBjaGFuZ2VkXHJcbiAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvQmFjaygpO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBvcHRpb25zKTtcclxuICAgIFxyXG4gICAgLy8gU2V0IG5hdmlnYXRpb24gdGl0bGUgb3Igbm90aGluZ1xyXG4gICAgdGhpcy5uYXZCYXIubGVmdEFjdGlvbigpLnRleHQob3B0aW9ucy50aXRsZSB8fCAnJyk7XHJcbiAgICBcclxuICAgIC8vIEZpZWxkIGhlYWRlclxyXG4gICAgdGhpcy52aWV3TW9kZWwuaGVhZGVyVGV4dChvcHRpb25zLmhlYWRlcik7XHJcbiAgICB0aGlzLnZpZXdNb2RlbC50ZXh0KG9wdGlvbnMudGV4dCk7XHJcbiAgICBpZiAob3B0aW9ucy5yb3dzTnVtYmVyKVxyXG4gICAgICAgIHRoaXMudmlld01vZGVsLnJvd3NOdW1iZXIob3B0aW9ucy5yb3dzTnVtYmVyKTtcclxuICAgICAgICBcclxuICAgIC8vIElubWVkaWF0ZSBmb2N1cyB0byB0aGUgdGV4dGFyZWEgZm9yIGJldHRlciB1c2FiaWxpdHlcclxuICAgIHRoaXMudGV4dGFyZWEuZm9jdXMoKTtcclxuICAgIHRoaXMuJHRleHRhcmVhLmNsaWNrKCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XHJcblxyXG4gICAgdGhpcy5oZWFkZXJUZXh0ID0ga28ub2JzZXJ2YWJsZSgnVGV4dCcpO1xyXG5cclxuICAgIC8vIFRleHQgdG8gZWRpdFxyXG4gICAgdGhpcy50ZXh0ID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcbiAgICBcclxuICAgIC8vIE51bWJlciBvZiByb3dzIGZvciB0aGUgdGV4dGFyZWFcclxuICAgIHRoaXMucm93c051bWJlciA9IGtvLm9ic2VydmFibGUoMik7XHJcblxyXG4gICAgdGhpcy5jYW5jZWwgPSBmdW5jdGlvbiBjYW5jZWwoKSB7XHJcbiAgICAgICAgdGhpcy5lbWl0KCdjYW5jZWwnKTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIHRoaXMuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICAgICAgdGhpcy5lbWl0KCdzYXZlZCcpO1xyXG4gICAgfTtcclxufVxyXG5cclxuVmlld01vZGVsLl9pbmhlcml0cyhFdmVudEVtaXR0ZXIpO1xyXG4iLCIvKipcclxuICAgIFdlZWtseVNjaGVkdWxlIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcblxyXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gV2Vla2x5U2NoZWR1bGVBY3Rpdml0eSgpIHtcclxuICAgIFxyXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIFxyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xyXG5cclxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignU2NoZWR1bGluZycpO1xyXG4gICAgXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLmFwcC5tb2RlbC5zaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUsXHJcbiAgICAgICAgZXZlbnQ6ICdlcnJvcicsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgIHZhciBtc2cgPSBlcnIudGFzayA9PT0gJ3NhdmUnID8gJ0Vycm9yIHNhdmluZyB5b3VyIHdlZWtseSBzY2hlZHVsZS4nIDogJ0Vycm9yIGxvYWRpbmcgeW91ciB3ZWVrbHkgc2NoZWR1bGUuJztcclxuICAgICAgICAgICAgdGhpcy5hcHAubW9kYWxzLnNob3dFcnJvcih7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogbXNnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVyciAmJiBlcnIudGFzayAmJiBlcnIuZXJyb3IgfHwgZXJyXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xyXG4gICAgXHJcbiAgICAvLyBLZWVwIGRhdGEgdXBkYXRlZDpcclxuICAgIHRoaXMuYXBwLm1vZGVsLnNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZS5zeW5jKCk7XHJcbiAgICAvLyBEaXNjYXJkIGFueSBwcmV2aW91cyB1bnNhdmVkIGVkaXRcclxuICAgIHRoaXMudmlld01vZGVsLmRpc2NhcmQoKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbChhcHApIHtcclxuXHJcbiAgICB2YXIgc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlID0gYXBwLm1vZGVsLnNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZTtcclxuXHJcbiAgICB2YXIgc2NoZWR1bGVWZXJzaW9uID0gc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlLm5ld1ZlcnNpb24oKTtcclxuICAgIHNjaGVkdWxlVmVyc2lvbi5pc09ic29sZXRlLnN1YnNjcmliZShmdW5jdGlvbihpdElzKSB7XHJcbiAgICAgICAgaWYgKGl0SXMpIHtcclxuICAgICAgICAgICAgLy8gbmV3IHZlcnNpb24gZnJvbSBzZXJ2ZXIgd2hpbGUgZWRpdGluZ1xyXG4gICAgICAgICAgICAvLyBGVVRVUkU6IHdhcm4gYWJvdXQgYSBuZXcgcmVtb3RlIHZlcnNpb24gYXNraW5nXHJcbiAgICAgICAgICAgIC8vIGNvbmZpcm1hdGlvbiB0byBsb2FkIHRoZW0gb3IgZGlzY2FyZCBhbmQgb3ZlcndyaXRlIHRoZW07XHJcbiAgICAgICAgICAgIC8vIHRoZSBzYW1lIGlzIG5lZWQgb24gc2F2ZSgpLCBhbmQgb24gc2VydmVyIHJlc3BvbnNlXHJcbiAgICAgICAgICAgIC8vIHdpdGggYSA1MDk6Q29uZmxpY3Qgc3RhdHVzIChpdHMgYm9keSBtdXN0IGNvbnRhaW4gdGhlXHJcbiAgICAgICAgICAgIC8vIHNlcnZlciB2ZXJzaW9uKS5cclxuICAgICAgICAgICAgLy8gUmlnaHQgbm93LCBqdXN0IG92ZXJ3cml0ZSBjdXJyZW50IGNoYW5nZXMgd2l0aFxyXG4gICAgICAgICAgICAvLyByZW1vdGUgb25lczpcclxuICAgICAgICAgICAgc2NoZWR1bGVWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gQWN0dWFsIGRhdGEgZm9yIHRoZSBmb3JtOlxyXG4gICAgdGhpcy5zY2hlZHVsZSA9IHNjaGVkdWxlVmVyc2lvbi52ZXJzaW9uO1xyXG5cclxuICAgIHRoaXMuaXNMb2NrZWQgPSBzaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUuaXNMb2NrZWQ7XHJcblxyXG4gICAgdGhpcy5zdWJtaXRUZXh0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKCkgPyBcclxuICAgICAgICAgICAgICAgICdsb2FkaW5nLi4uJyA6IFxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc1NhdmluZygpID8gXHJcbiAgICAgICAgICAgICAgICAgICAgJ3NhdmluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgICAgICAnU2F2ZSdcclxuICAgICAgICApO1xyXG4gICAgfSwgc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNjYXJkID0gZnVuY3Rpb24gZGlzY2FyZCgpIHtcclxuICAgICAgICBzY2hlZHVsZVZlcnNpb24ucHVsbCh7IGV2ZW5JZk5ld2VyOiB0cnVlIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgICAgIC8vIEZvcmNlIHRvIHNhdmUsIGV2ZW4gaWYgdGhlcmUgd2FzIHJlbW90ZSB1cGRhdGVzXHJcbiAgICAgICAgc2NoZWR1bGVWZXJzaW9uLnB1c2goeyBldmVuSWZPYnNvbGV0ZTogdHJ1ZSB9KTtcclxuICAgIH07XHJcbn1cclxuIiwiLyoqXHJcbiAgICBSZWdpc3RyYXRpb24gb2YgY3VzdG9tIGh0bWwgY29tcG9uZW50cyB1c2VkIGJ5IHRoZSBBcHAuXHJcbiAgICBBbGwgd2l0aCAnYXBwLScgYXMgcHJlZml4LlxyXG4gICAgXHJcbiAgICBTb21lIGRlZmluaXRpb25zIG1heSBiZSBpbmNsdWRlZCBvbi1saW5lIHJhdGhlciB0aGFuIG9uIHNlcGFyYXRlZFxyXG4gICAgZmlsZXMgKHZpZXdtb2RlbHMpLCB0ZW1wbGF0ZXMgYXJlIGxpbmtlZCBzbyBuZWVkIHRvIGJlIFxyXG4gICAgaW5jbHVkZWQgaW4gdGhlIGh0bWwgZmlsZSB3aXRoIHRoZSBzYW1lIElEIHRoYXQgcmVmZXJlbmNlZCBoZXJlLFxyXG4gICAgdXN1YWxseSB1c2luZyBhcyBET00gSUQgdGhlIHNhbWUgbmFtZSBhcyB0aGUgY29tcG9uZW50IHdpdGggc3VmaXggJy10ZW1wbGF0ZScuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgcHJvcFRvb2xzID0gcmVxdWlyZSgnLi91dGlscy9qc1Byb3BlcnRpZXNUb29scycpLFxyXG4gICAgZ2V0T2JzZXJ2YWJsZSA9IHJlcXVpcmUoJy4vdXRpbHMvZ2V0T2JzZXJ2YWJsZScpO1xyXG5cclxuZXhwb3J0cy5yZWdpc3RlckFsbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgXHJcbiAgICAvLy8gbmF2YmFyLWFjdGlvblxyXG4gICAga28uY29tcG9uZW50cy5yZWdpc3RlcignYXBwLW5hdmJhci1hY3Rpb24nLCB7XHJcbiAgICAgICAgdGVtcGxhdGU6IHsgZWxlbWVudDogJ25hdmJhci1hY3Rpb24tdGVtcGxhdGUnIH0sXHJcbiAgICAgICAgdmlld01vZGVsOiBmdW5jdGlvbihwYXJhbXMpIHtcclxuXHJcbiAgICAgICAgICAgIHByb3BUb29scy5kZWZpbmVHZXR0ZXIodGhpcywgJ2FjdGlvbicsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgICAgICBwYXJhbXMuYWN0aW9uICYmIHBhcmFtcy5uYXZCYXIoKSA/XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zLm5hdkJhcigpW3BhcmFtcy5hY3Rpb25dKCkgOlxyXG4gICAgICAgICAgICAgICAgICAgIG51bGxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLy8gdW5sYWJlbGVkLWlucHV0XHJcbiAgICBrby5jb21wb25lbnRzLnJlZ2lzdGVyKCdhcHAtdW5sYWJlbGVkLWlucHV0Jywge1xyXG4gICAgICAgIHRlbXBsYXRlOiB7IGVsZW1lbnQ6ICd1bmxhYmVsZWQtaW5wdXQtdGVtcGxhdGUnIH0sXHJcbiAgICAgICAgdmlld01vZGVsOiBmdW5jdGlvbihwYXJhbXMpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSBnZXRPYnNlcnZhYmxlKHBhcmFtcy52YWx1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMucGxhY2Vob2xkZXIgPSBnZXRPYnNlcnZhYmxlKHBhcmFtcy5wbGFjZWhvbGRlcik7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzYWJsZSA9IGdldE9ic2VydmFibGUocGFyYW1zLmRpc2FibGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLy8gZmVlZGJhY2stZW50cnlcclxuICAgIGtvLmNvbXBvbmVudHMucmVnaXN0ZXIoJ2FwcC1mZWVkYmFjay1lbnRyeScsIHtcclxuICAgICAgICB0ZW1wbGF0ZTogeyBlbGVtZW50OiAnZmVlZGJhY2stZW50cnktdGVtcGxhdGUnIH0sXHJcbiAgICAgICAgdmlld01vZGVsOiBmdW5jdGlvbihwYXJhbXMpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2VjdGlvbiA9IGdldE9ic2VydmFibGUocGFyYW1zLnNlY3Rpb24gfHwgJycpO1xyXG4gICAgICAgICAgICB0aGlzLnVybCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAnL2ZlZWRiYWNrLycgKyB0aGlzLnNlY3Rpb24oKTtcclxuICAgICAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vLyBmZWVkYmFjay1lbnRyeVxyXG4gICAga28uY29tcG9uZW50cy5yZWdpc3RlcignYXBwLXRpbWUtc2xvdC10aWxlJywge1xyXG4gICAgICAgIHRlbXBsYXRlOiB7IGVsZW1lbnQ6ICd0aW1lLXNsb3QtdGlsZS10ZW1wbGF0ZScgfSxcclxuICAgICAgICB2aWV3TW9kZWw6IHJlcXVpcmUoJy4vdmlld21vZGVscy9UaW1lU2xvdCcpXHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBOYXZiYXIgZXh0ZW5zaW9uIG9mIHRoZSBBcHAsXHJcbiAgICBhZGRzIHRoZSBlbGVtZW50cyB0byBtYW5hZ2UgYSB2aWV3IG1vZGVsXHJcbiAgICBmb3IgdGhlIE5hdkJhciBhbmQgYXV0b21hdGljIGNoYW5nZXNcclxuICAgIHVuZGVyIHNvbWUgbW9kZWwgY2hhbmdlcyBsaWtlIHVzZXIgbG9naW4vbG9nb3V0XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi92aWV3bW9kZWxzL05hdkJhcicpLFxyXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xyXG5cclxuZXhwb3J0cy5leHRlbmRzID0gZnVuY3Rpb24gKGFwcCkge1xyXG4gICAgXHJcbiAgICAvLyBSRVZJRVc6IHN0aWxsIG5lZWRlZD8gTWF5YmUgdGhlIHBlciBhY3Rpdml0eSBuYXZCYXIgbWVhbnNcclxuICAgIC8vIHRoaXMgaXMgbm90IG5lZWRlZC4gU29tZSBwcmV2aW91cyBsb2dpYyB3YXMgYWxyZWFkeSByZW1vdmVkXHJcbiAgICAvLyBiZWNhdXNlIHdhcyB1c2VsZXNzLlxyXG4gICAgLy9cclxuICAgIC8vIEFkanVzdCB0aGUgbmF2YmFyIHNldHVwIGRlcGVuZGluZyBvbiBjdXJyZW50IHVzZXIsXHJcbiAgICAvLyBzaW5jZSBkaWZmZXJlbnQgdGhpbmdzIGFyZSBuZWVkIGZvciBsb2dnZWQtaW4vb3V0LlxyXG4gICAgZnVuY3Rpb24gYWRqdXN0VXNlckJhcigpIHtcclxuXHJcbiAgICAgICAgdmFyIHVzZXIgPSBhcHAubW9kZWwudXNlcigpO1xyXG5cclxuICAgICAgICBpZiAodXNlci5pc0Fub255bW91cygpKSB7XHJcbiAgICAgICAgICAgIGFwcC5uYXZCYXIoKS5yaWdodEFjdGlvbihOYXZBY3Rpb24ubWVudU91dCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gQ29tbWVudGVkIGxpbmVzLCB1c2VkIHByZXZpb3VzbHkgYnV0IHVudXNlZCBub3csIGl0IG11c3QgYmUgZW5vdWdoIHdpdGggdGhlIHVwZGF0ZVxyXG4gICAgLy8gcGVyIGFjdGl2aXR5IGNoYW5nZVxyXG4gICAgLy9hcHAubW9kZWwudXNlcigpLmlzQW5vbnltb3VzLnN1YnNjcmliZSh1cGRhdGVTdGF0ZXNPblVzZXJDaGFuZ2UpO1xyXG4gICAgLy9hcHAubW9kZWwudXNlcigpLm9uYm9hcmRpbmdTdGVwLnN1YnNjcmliZSh1cGRhdGVTdGF0ZXNPblVzZXJDaGFuZ2UpO1xyXG4gICAgXHJcbiAgICBhcHAubmF2QmFyID0ga28ub2JzZXJ2YWJsZShudWxsKTtcclxuICAgIFxyXG4gICAgdmFyIHJlZnJlc2hOYXYgPSBmdW5jdGlvbiByZWZyZXNoTmF2KCkge1xyXG4gICAgICAgIC8vIFRyaWdnZXIgZXZlbnQgdG8gZm9yY2UgYSBjb21wb25lbnQgdXBkYXRlXHJcbiAgICAgICAgJCgnLkFwcE5hdicpLnRyaWdnZXIoJ2NvbnRlbnRDaGFuZ2UnKTtcclxuICAgIH07XHJcbiAgICB2YXIgYXV0b1JlZnJlc2hOYXYgPSBmdW5jdGlvbiBhdXRvUmVmcmVzaE5hdihhY3Rpb24pIHtcclxuICAgICAgICBpZiAoYWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGFjdGlvbi50ZXh0LnN1YnNjcmliZShyZWZyZXNoTmF2KTtcclxuICAgICAgICAgICAgYWN0aW9uLmlzVGl0bGUuc3Vic2NyaWJlKHJlZnJlc2hOYXYpO1xyXG4gICAgICAgICAgICBhY3Rpb24uaWNvbi5zdWJzY3JpYmUocmVmcmVzaE5hdik7XHJcbiAgICAgICAgICAgIGFjdGlvbi5pc01lbnUuc3Vic2NyaWJlKHJlZnJlc2hOYXYpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgICAgVXBkYXRlIHRoZSBuYXYgbW9kZWwgdXNpbmcgdGhlIEFjdGl2aXR5IGRlZmF1bHRzXHJcbiAgICAqKi9cclxuICAgIGFwcC51cGRhdGVBcHBOYXYgPSBmdW5jdGlvbiB1cGRhdGVBcHBOYXYoYWN0aXZpdHkpIHtcclxuXHJcbiAgICAgICAgLy8gaWYgdGhlIGFjdGl2aXR5IGhhcyBpdHMgb3duXHJcbiAgICAgICAgaWYgKCduYXZCYXInIGluIGFjdGl2aXR5KSB7XHJcbiAgICAgICAgICAgIC8vIFVzZSBzcGVjaWFsaXppZWQgYWN0aXZpdHkgYmFyIGRhdGFcclxuICAgICAgICAgICAgYXBwLm5hdkJhcihhY3Rpdml0eS5uYXZCYXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gVXNlIGRlZmF1bHQgb25lXHJcbiAgICAgICAgICAgIGFwcC5uYXZCYXIobmV3IE5hdkJhcigpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFRPRE8gRG91YmxlIGNoZWNrIGlmIG5lZWRlZC5cclxuICAgICAgICAvLyBMYXRlc3QgY2hhbmdlcywgd2hlbiBuZWVkZWRcclxuICAgICAgICBhZGp1c3RVc2VyQmFyKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmVmcmVzaE5hdigpO1xyXG4gICAgICAgIGF1dG9SZWZyZXNoTmF2KGFwcC5uYXZCYXIoKS5sZWZ0QWN0aW9uKCkpO1xyXG4gICAgICAgIGF1dG9SZWZyZXNoTmF2KGFwcC5uYXZCYXIoKS5yaWdodEFjdGlvbigpKTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgVXBkYXRlIHRoZSBhcHAgbWVudSB0byBoaWdobGlnaHQgdGhlXHJcbiAgICAgICAgZ2l2ZW4gbGluayBuYW1lXHJcbiAgICAqKi9cclxuICAgIGFwcC51cGRhdGVNZW51ID0gZnVuY3Rpb24gdXBkYXRlTWVudShuYW1lKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyICRtZW51ID0gJCgnLkFwcC1tZW51cyAubmF2YmFyLWNvbGxhcHNlJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gUmVtb3ZlIGFueSBhY3RpdmVcclxuICAgICAgICAkbWVudVxyXG4gICAgICAgIC5maW5kKCdsaScpXHJcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcclxuICAgICAgICAvLyBBZGQgYWN0aXZlXHJcbiAgICAgICAgJG1lbnVcclxuICAgICAgICAuZmluZCgnLmdvLScgKyBuYW1lKVxyXG4gICAgICAgIC5jbG9zZXN0KCdsaScpXHJcbiAgICAgICAgLmFkZENsYXNzKCdhY3RpdmUnKTtcclxuICAgICAgICAvLyBIaWRlIG1lbnVcclxuICAgICAgICAkbWVudVxyXG4gICAgICAgIC5maWx0ZXIoJzp2aXNpYmxlJylcclxuICAgICAgICAuY29sbGFwc2UoJ2hpZGUnKTtcclxuICAgIH07XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgTGlzdCBvZiBhY3Rpdml0aWVzIGxvYWRlZCBpbiB0aGUgQXBwLFxyXG4gICAgYXMgYW4gb2JqZWN0IHdpdGggdGhlIGFjdGl2aXR5IG5hbWUgYXMgdGhlIGtleVxyXG4gICAgYW5kIHRoZSBjb250cm9sbGVyIGFzIHZhbHVlLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAnY2FsZW5kYXInOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvY2FsZW5kYXInKSxcclxuICAgICdkYXRldGltZVBpY2tlcic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9kYXRldGltZVBpY2tlcicpLFxyXG4gICAgJ2NsaWVudHMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvY2xpZW50cycpLFxyXG4gICAgJ3NlcnZpY2VzJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL3NlcnZpY2VzJyksXHJcbiAgICAnbG9jYXRpb25zJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2xvY2F0aW9ucycpLFxyXG4gICAgJ3RleHRFZGl0b3InOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvdGV4dEVkaXRvcicpLFxyXG4gICAgJ2hvbWUnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvaG9tZScpLFxyXG4gICAgJ2FwcG9pbnRtZW50JzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2FwcG9pbnRtZW50JyksXHJcbiAgICAnYm9va2luZ0NvbmZpcm1hdGlvbic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9ib29raW5nQ29uZmlybWF0aW9uJyksXHJcbiAgICAnaW5kZXgnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvaW5kZXgnKSxcclxuICAgICdsb2dpbic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9sb2dpbicpLFxyXG4gICAgJ2xvZ291dCc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9sb2dvdXQnKSxcclxuICAgICdsZWFybk1vcmUnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvbGVhcm5Nb3JlJyksXHJcbiAgICAnc2lnbnVwJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL3NpZ251cCcpLFxyXG4gICAgJ2NvbnRhY3RJbmZvJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NvbnRhY3RJbmZvJyksXHJcbiAgICAnb25ib2FyZGluZ1Bvc2l0aW9ucyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9vbmJvYXJkaW5nUG9zaXRpb25zJyksXHJcbiAgICAnb25ib2FyZGluZ0hvbWUnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvb25ib2FyZGluZ0hvbWUnKSxcclxuICAgICdsb2NhdGlvbkVkaXRpb24nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvbG9jYXRpb25FZGl0aW9uJyksXHJcbiAgICAnb25ib2FyZGluZ0NvbXBsZXRlJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL29uYm9hcmRpbmdDb21wbGV0ZScpLFxyXG4gICAgJ2FjY291bnQnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvYWNjb3VudCcpLFxyXG4gICAgJ2luYm94JzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2luYm94JyksXHJcbiAgICAnY29udmVyc2F0aW9uJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NvbnZlcnNhdGlvbicpLFxyXG4gICAgJ3NjaGVkdWxpbmcnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvc2NoZWR1bGluZycpLFxyXG4gICAgJ2pvYnRpdGxlcyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9qb2J0aXRsZXMnKSxcclxuICAgICdmZWVkYmFjayc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9mZWVkYmFjaycpLFxyXG4gICAgJ2ZhcXMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvZmFxcycpLFxyXG4gICAgJ2ZlZWRiYWNrRm9ybSc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9mZWVkYmFja0Zvcm0nKSxcclxuICAgICdjb250YWN0Rm9ybSc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jb250YWN0Rm9ybScpLFxyXG4gICAgJ2Ntcyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jbXMnKSxcclxuICAgICdjbGllbnRFZGl0aW9uJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NsaWVudEVkaXRpb24nKSxcclxuICAgICdzY2hlZHVsaW5nUHJlZmVyZW5jZXMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvc2NoZWR1bGluZ1ByZWZlcmVuY2VzJyksXHJcbiAgICAnY2FsZW5kYXJTeW5jaW5nJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NhbGVuZGFyU3luY2luZycpLFxyXG4gICAgJ3dlZWtseVNjaGVkdWxlJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL3dlZWtseVNjaGVkdWxlJyksXHJcbiAgICAnYm9va01lQnV0dG9uJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2Jvb2tNZUJ1dHRvbicpLFxyXG4gICAgJ293bmVySW5mbyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9vd25lckluZm8nKSxcclxuICAgICdwcml2YWN5U2V0dGluZ3MnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvcHJpdmFjeVNldHRpbmdzJylcclxufTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqIEdsb2JhbCBkZXBlbmRlbmNpZXMgKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS1tb2JpbGUnKTtcclxucmVxdWlyZSgnLi91dGlscy9qcXVlcnkubXVsdGlsaW5lJyk7XHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbmtvLmJpbmRpbmdIYW5kbGVycy5mb3JtYXQgPSByZXF1aXJlKCdrby9mb3JtYXRCaW5kaW5nJykuZm9ybWF0QmluZGluZztcclxudmFyIGJvb3Rrbm9jayA9IHJlcXVpcmUoJy4vdXRpbHMvYm9vdGtub2NrQmluZGluZ0hlbHBlcnMnKTtcclxucmVxdWlyZSgnLi91dGlscy9GdW5jdGlvbi5wcm90b3R5cGUuX2luaGVyaXRzJyk7XHJcbnJlcXVpcmUoJy4vdXRpbHMvRnVuY3Rpb24ucHJvdG90eXBlLl9kZWxheWVkJyk7XHJcbi8vIFByb21pc2UgcG9seWZpbGwsIHNvIGl0cyBub3QgJ3JlcXVpcmUnZCBwZXIgbW9kdWxlOlxyXG5yZXF1aXJlKCdlczYtcHJvbWlzZScpLnBvbHlmaWxsKCk7XHJcblxyXG52YXIgbGF5b3V0VXBkYXRlRXZlbnQgPSByZXF1aXJlKCdsYXlvdXRVcGRhdGVFdmVudCcpO1xyXG52YXIgQXBwTW9kZWwgPSByZXF1aXJlKCcuL3ZpZXdtb2RlbHMvQXBwTW9kZWwnKTtcclxuXHJcbi8vIFJlZ2lzdGVyIHRoZSBzcGVjaWFsIGxvY2FsZVxyXG5yZXF1aXJlKCcuL2xvY2FsZXMvZW4tVVMtTEMnKTtcclxuXHJcbi8qKlxyXG4gICAgQSBzZXQgb2YgZml4ZXMvd29ya2Fyb3VuZHMgZm9yIEJvb3RzdHJhcCBiZWhhdmlvci9wbHVnaW5zXHJcbiAgICB0byBiZSBleGVjdXRlZCBiZWZvcmUgQm9vdHN0cmFwIGlzIGluY2x1ZGVkL2V4ZWN1dGVkLlxyXG4gICAgRm9yIGV4YW1wbGUsIGJlY2F1c2Ugb2YgZGF0YS1iaW5kaW5nIHJlbW92aW5nL2NyZWF0aW5nIGVsZW1lbnRzLFxyXG4gICAgc29tZSBvbGQgcmVmZXJlbmNlcyB0byByZW1vdmVkIGl0ZW1zIG1heSBnZXQgYWxpdmUgYW5kIG5lZWQgdXBkYXRlLFxyXG4gICAgb3IgcmUtZW5hYmxpbmcgc29tZSBiZWhhdmlvcnMuXHJcbioqL1xyXG5mdW5jdGlvbiBwcmVCb290c3RyYXBXb3JrYXJvdW5kcygpIHtcclxuICAgIC8vIEludGVybmFsIEJvb3RzdHJhcCBzb3VyY2UgdXRpbGl0eVxyXG4gICAgZnVuY3Rpb24gZ2V0VGFyZ2V0RnJvbVRyaWdnZXIoJHRyaWdnZXIpIHtcclxuICAgICAgICB2YXIgaHJlZixcclxuICAgICAgICAgICAgdGFyZ2V0ID0gJHRyaWdnZXIuYXR0cignZGF0YS10YXJnZXQnKSB8fFxyXG4gICAgICAgICAgICAoaHJlZiA9ICR0cmlnZ2VyLmF0dHIoJ2hyZWYnKSkgJiYgXHJcbiAgICAgICAgICAgIGhyZWYucmVwbGFjZSgvLiooPz0jW15cXHNdKyQpLywgJycpOyAvLyBzdHJpcCBmb3IgaWU3XHJcblxyXG4gICAgICAgIHJldHVybiAkKHRhcmdldCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEJ1ZzogbmF2YmFyLWNvbGxhcHNlIGVsZW1lbnRzIGhvbGQgYSByZWZlcmVuY2UgdG8gdGhlaXIgb3JpZ2luYWxcclxuICAgIC8vICR0cmlnZ2VyLCBidXQgdGhhdCB0cmlnZ2VyIGNhbiBjaGFuZ2Ugb24gZGlmZmVyZW50ICdjbGlja3MnIG9yXHJcbiAgICAvLyBnZXQgcmVtb3ZlZCB0aGUgb3JpZ2luYWwsIHNvIGl0IG11c3QgcmVmZXJlbmNlIHRoZSBuZXcgb25lXHJcbiAgICAvLyAodGhlIGxhdGVzdHMgY2xpY2tlZCwgYW5kIG5vdCB0aGUgY2FjaGVkIG9uZSB1bmRlciB0aGUgJ2RhdGEnIEFQSSkuICAgIFxyXG4gICAgLy8gTk9URTogaGFuZGxlciBtdXN0IGV4ZWN1dGUgYmVmb3JlIHRoZSBCb290c3RyYXAgaGFuZGxlciBmb3IgdGhlIHNhbWVcclxuICAgIC8vIGV2ZW50IGluIG9yZGVyIHRvIHdvcmsuXHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2suYnMuY29sbGFwc2UuZGF0YS1hcGkud29ya2Fyb3VuZCcsICdbZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiXScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyksXHJcbiAgICAgICAgICAgICR0YXJnZXQgPSBnZXRUYXJnZXRGcm9tVHJpZ2dlcigkdCksXHJcbiAgICAgICAgICAgIGRhdGEgPSAkdGFyZ2V0ICYmICR0YXJnZXQuZGF0YSgnYnMuY29sbGFwc2UnKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBJZiBhbnlcclxuICAgICAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgICAgICAvLyBSZXBsYWNlIHRoZSB0cmlnZ2VyIGluIHRoZSBkYXRhIHJlZmVyZW5jZTpcclxuICAgICAgICAgICAgZGF0YS4kdHJpZ2dlciA9ICR0O1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBPbiBlbHNlLCBub3RoaW5nIHRvIGRvLCBhIG5ldyBDb2xsYXBzZSBpbnN0YW5jZSB3aWxsIGJlIGNyZWF0ZWRcclxuICAgICAgICAvLyB3aXRoIHRoZSBjb3JyZWN0IHRhcmdldCwgdGhlIGZpcnN0IHRpbWVcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICAgIEFwcCBzdGF0aWMgY2xhc3NcclxuKiovXHJcbnZhciBhcHAgPSB7XHJcbiAgICBzaGVsbDogcmVxdWlyZSgnLi9hcHAuc2hlbGwnKSxcclxuICAgIFxyXG4gICAgLy8gTmV3IGFwcCBtb2RlbCwgdGhhdCBzdGFydHMgd2l0aCBhbm9ueW1vdXMgdXNlclxyXG4gICAgbW9kZWw6IG5ldyBBcHBNb2RlbCgpLFxyXG4gICAgXHJcbiAgICAvKiogTG9hZCBhY3Rpdml0aWVzIGNvbnRyb2xsZXJzIChub3QgaW5pdGlhbGl6ZWQpICoqL1xyXG4gICAgYWN0aXZpdGllczogcmVxdWlyZSgnLi9hcHAuYWN0aXZpdGllcycpLFxyXG4gICAgXHJcbiAgICBtb2RhbHM6IHJlcXVpcmUoJy4vYXBwLm1vZGFscycpLFxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBKdXN0IHJlZGlyZWN0IHRoZSBiZXR0ZXIgcGxhY2UgZm9yIGN1cnJlbnQgdXNlciBhbmQgc3RhdGUuXHJcbiAgICAgICAgTk9URTogSXRzIGEgZGVsYXllZCBmdW5jdGlvbiwgc2luY2Ugb24gbWFueSBjb250ZXh0cyBuZWVkIHRvXHJcbiAgICAgICAgd2FpdCBmb3IgdGhlIGN1cnJlbnQgJ3JvdXRpbmcnIGZyb20gZW5kIGJlZm9yZSBkbyB0aGUgbmV3XHJcbiAgICAgICAgaGlzdG9yeSBjaGFuZ2UuXHJcbiAgICAgICAgVE9ETzogTWF5YmUsIHJhdGhlciB0aGFuIGRlbGF5IGl0LCBjYW4gc3RvcCBjdXJyZW50IHJvdXRpbmdcclxuICAgICAgICAoY2hhbmdlcyBvbiBTaGVsbCByZXF1aXJlZCkgYW5kIHBlcmZvcm0gdGhlIG5ldy5cclxuICAgICAgICBUT0RPOiBNYXliZSBhbHRlcm5hdGl2ZSB0byBwcmV2aW91cywgdG8gcHJvdmlkZSBhICdyZXBsYWNlJ1xyXG4gICAgICAgIGluIHNoZWxsIHJhdGhlciB0aGFuIGEgZ28sIHRvIGF2b2lkIGFwcGVuZCByZWRpcmVjdCBlbnRyaWVzXHJcbiAgICAgICAgaW4gdGhlIGhpc3RvcnksIHRoYXQgY3JlYXRlIHRoZSBwcm9ibGVtIG9mICdicm9rZW4gYmFjayBidXR0b24nXHJcbiAgICAqKi9cclxuICAgIGdvRGFzaGJvYXJkOiBmdW5jdGlvbiBnb0Rhc2hib2FyZCgpIHtcclxuICAgICAgICBcclxuICAgICAgICAvLyBUbyBhdm9pZCBpbmZpbml0ZSBsb29wcyBpZiB3ZSBhbHJlYWR5IGFyZSBwZXJmb3JtaW5nIFxyXG4gICAgICAgIC8vIGEgZ29EYXNoYm9hcmQgdGFzaywgd2UgZmxhZyB0aGUgZXhlY3V0aW9uXHJcbiAgICAgICAgLy8gYmVpbmcgY2FyZSBvZiB0aGUgZGVsYXkgaW50cm9kdWNlZCBpbiB0aGUgZXhlY3V0aW9uXHJcbiAgICAgICAgaWYgKGdvRGFzaGJvYXJkLl9nb2luZyA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBEZWxheWVkIHRvIGF2b2lkIGNvbGxpc2lvbnMgd2l0aCBpbi10aGUtbWlkZGxlXHJcbiAgICAgICAgICAgIC8vIHRhc2tzOiBqdXN0IGFsbG93aW5nIGN1cnJlbnQgcm91dGluZyB0byBmaW5pc2hcclxuICAgICAgICAgICAgLy8gYmVmb3JlIHBlcmZvcm0gdGhlICdyZWRpcmVjdCdcclxuICAgICAgICAgICAgLy8gVE9ETzogY2hhbmdlIGJ5IGEgcmVhbCByZWRpcmVjdCB0aGF0IGlzIGFibGUgdG9cclxuICAgICAgICAgICAgLy8gY2FuY2VsIHRoZSBjdXJyZW50IGFwcC5zaGVsbCByb3V0aW5nIHByb2Nlc3MuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBnb0Rhc2hib2FyZC5fZ29pbmcgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBvbmJvYXJkaW5nID0gdGhpcy5tb2RlbC51c2VyKCkub25ib2FyZGluZ1N0ZXAoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAob25ib2FyZGluZykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hlbGwuZ28oJ29uYm9hcmRpbmdIb21lLycgKyBvbmJvYXJkaW5nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hlbGwuZ28oJ2hvbWUnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBKdXN0IGJlY2F1c2UgaXMgZGVsYXllZCwgbmVlZHNcclxuICAgICAgICAgICAgICAgIC8vIHRvIGJlIHNldCBvZmYgYWZ0ZXIgYW4gaW5tZWRpYXRlIHRvIFxyXG4gICAgICAgICAgICAgICAgLy8gZW5zdXJlIGlzIHNldCBvZmYgYWZ0ZXIgYW55IG90aGVyIGF0dGVtcHRcclxuICAgICAgICAgICAgICAgIC8vIHRvIGFkZCBhIGRlbGF5ZWQgZ29EYXNoYm9hcmQ6XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGdvRGFzaGJvYXJkLl9nb2luZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfSwgMSk7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqIENvbnRpbnVlIGFwcCBjcmVhdGlvbiB3aXRoIHRoaW5ncyB0aGF0IG5lZWQgYSByZWZlcmVuY2UgdG8gdGhlIGFwcCAqKi9cclxuXHJcbnJlcXVpcmUoJy4vYXBwLW5hdmJhcicpLmV4dGVuZHMoYXBwKTtcclxuXHJcbnJlcXVpcmUoJy4vYXBwLWNvbXBvbmVudHMnKS5yZWdpc3RlckFsbCgpO1xyXG5cclxuYXBwLmdldEFjdGl2aXR5ID0gZnVuY3Rpb24gZ2V0QWN0aXZpdHkobmFtZSkge1xyXG4gICAgdmFyIGFjdGl2aXR5ID0gdGhpcy5hY3Rpdml0aWVzW25hbWVdO1xyXG4gICAgaWYgKGFjdGl2aXR5KSB7XHJcbiAgICAgICAgdmFyICRhY3QgPSB0aGlzLnNoZWxsLml0ZW1zLmZpbmQobmFtZSk7XHJcbiAgICAgICAgaWYgKCRhY3QgJiYgJGFjdC5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybiBhY3Rpdml0eS5pbml0KCRhY3QsIHRoaXMpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbn07XHJcblxyXG5hcHAuZ2V0QWN0aXZpdHlDb250cm9sbGVyQnlSb3V0ZSA9IGZ1bmN0aW9uIGdldEFjdGl2aXR5Q29udHJvbGxlckJ5Um91dGUocm91dGUpIHtcclxuICAgIC8vIEZyb20gdGhlIHJvdXRlIG9iamVjdCwgdGhlIGltcG9ydGFudCBwaWVjZSBpcyByb3V0ZS5uYW1lXHJcbiAgICAvLyB0aGF0IGNvbnRhaW5zIHRoZSBhY3Rpdml0eSBuYW1lIGV4Y2VwdCBpZiBpcyB0aGUgcm9vdFxyXG4gICAgdmFyIGFjdE5hbWUgPSByb3V0ZS5uYW1lIHx8IHRoaXMuc2hlbGwuaW5kZXhOYW1lO1xyXG4gICAgXHJcbiAgICByZXR1cm4gdGhpcy5nZXRBY3Rpdml0eShhY3ROYW1lKTtcclxufTtcclxuXHJcbi8vIGFjY2Vzc0NvbnRyb2wgc2V0dXA6IGNhbm5vdCBiZSBzcGVjaWZpZWQgb24gU2hlbGwgY3JlYXRpb24gYmVjYXVzZVxyXG4vLyBkZXBlbmRzIG9uIHRoZSBhcHAgaW5zdGFuY2VcclxuYXBwLnNoZWxsLmFjY2Vzc0NvbnRyb2wgPSByZXF1aXJlKCcuL3V0aWxzL2FjY2Vzc0NvbnRyb2wnKShhcHApO1xyXG5cclxuLy8gU2hvcnRjdXQgdG8gVXNlclR5cGUgZW51bWVyYXRpb24gdXNlZCB0byBzZXQgcGVybWlzc2lvbnNcclxuYXBwLlVzZXJUeXBlID0gYXBwLm1vZGVsLnVzZXIoKS5jb25zdHJ1Y3Rvci5Vc2VyVHlwZTtcclxuXHJcbi8qKiBBcHAgSW5pdCAqKi9cclxudmFyIGFwcEluaXQgPSBmdW5jdGlvbiBhcHBJbml0KCkge1xyXG4gICAgLypqc2hpbnQgbWF4c3RhdGVtZW50czo1MCxtYXhjb21wbGV4aXR5OjE2ICovXHJcbiAgICBcclxuICAgIC8vIEVuYWJsaW5nIHRoZSAnbGF5b3V0VXBkYXRlJyBqUXVlcnkgV2luZG93IGV2ZW50IHRoYXQgaGFwcGVucyBvbiByZXNpemUgYW5kIHRyYW5zaXRpb25lbmQsXHJcbiAgICAvLyBhbmQgY2FuIGJlIHRyaWdnZXJlZCBtYW51YWxseSBieSBhbnkgc2NyaXB0IHRvIG5vdGlmeSBjaGFuZ2VzIG9uIGxheW91dCB0aGF0XHJcbiAgICAvLyBtYXkgcmVxdWlyZSBhZGp1c3RtZW50cyBvbiBvdGhlciBzY3JpcHRzIHRoYXQgbGlzdGVuIHRvIGl0LlxyXG4gICAgLy8gVGhlIGV2ZW50IGlzIHRocm90dGxlLCBndWFyYW50aW5nIHRoYXQgdGhlIG1pbm9yIGhhbmRsZXJzIGFyZSBleGVjdXRlZCByYXRoZXJcclxuICAgIC8vIHRoYW4gYSBsb3Qgb2YgdGhlbSBpbiBzaG9ydCB0aW1lIGZyYW1lcyAoYXMgaGFwcGVuIHdpdGggJ3Jlc2l6ZScgZXZlbnRzKS5cclxuICAgIGxheW91dFVwZGF0ZUV2ZW50LmxheW91dFVwZGF0ZUV2ZW50ICs9ICcgb3JpZW50YXRpb25jaGFuZ2UnO1xyXG4gICAgbGF5b3V0VXBkYXRlRXZlbnQub24oKTtcclxuICAgIFxyXG4gICAgLy8gS2V5Ym9hcmQgcGx1Z2luIGV2ZW50cyBhcmUgbm90IGNvbXBhdGlibGUgd2l0aCBqUXVlcnkgZXZlbnRzLCBidXQgbmVlZGVkIHRvXHJcbiAgICAvLyB0cmlnZ2VyIGEgbGF5b3V0VXBkYXRlLCBzbyBoZXJlIGFyZSBjb25uZWN0ZWQsIG1haW5seSBmaXhpbmcgYnVncyBvbiBpT1Mgd2hlbiB0aGUga2V5Ym9hcmRcclxuICAgIC8vIGlzIGhpZGRpbmcuXHJcbiAgICB2YXIgdHJpZ0xheW91dCA9IGZ1bmN0aW9uIHRyaWdMYXlvdXQoKSB7XHJcbiAgICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ2xheW91dFVwZGF0ZScpO1xyXG4gICAgfTtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCduYXRpdmUua2V5Ym9hcmRzaG93JywgdHJpZ0xheW91dCk7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbmF0aXZlLmtleWJvYXJkaGlkZScsIHRyaWdMYXlvdXQpO1xyXG5cclxuICAgIC8vIGlPUy03KyBzdGF0dXMgYmFyIGZpeC4gQXBwbHkgb24gcGx1Z2luIGxvYWRlZCAoY29yZG92YS9waG9uZWdhcCBlbnZpcm9ubWVudClcclxuICAgIC8vIGFuZCBpbiBhbnkgc3lzdGVtLCBzbyBhbnkgb3RoZXIgc3lzdGVtcyBmaXggaXRzIHNvbHZlZCB0b28gaWYgbmVlZGVkIFxyXG4gICAgLy8ganVzdCB1cGRhdGluZyB0aGUgcGx1Z2luIChmdXR1cmUgcHJvb2YpIGFuZCBlbnN1cmUgaG9tb2dlbmVvdXMgY3Jvc3MgcGxhZnRmb3JtIGJlaGF2aW9yLlxyXG4gICAgaWYgKHdpbmRvdy5TdGF0dXNCYXIpIHtcclxuICAgICAgICAvLyBGaXggaU9TLTcrIG92ZXJsYXkgcHJvYmxlbVxyXG4gICAgICAgIC8vIElzIGluIGNvbmZpZy54bWwgdG9vLCBidXQgc2VlbXMgbm90IHRvIHdvcmsgd2l0aG91dCBuZXh0IGNhbGw6XHJcbiAgICAgICAgd2luZG93LlN0YXR1c0Jhci5vdmVybGF5c1dlYlZpZXcoZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBpT3NXZWJ2aWV3ID0gZmFsc2U7XHJcbiAgICBpZiAod2luZG93LmRldmljZSAmJiBcclxuICAgICAgICAvaU9TfGlQYWR8aVBob25lfGlQb2QvaS50ZXN0KHdpbmRvdy5kZXZpY2UucGxhdGZvcm0pKSB7XHJcbiAgICAgICAgaU9zV2VidmlldyA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIE5PVEU6IFNhZmFyaSBpT1MgYnVnIHdvcmthcm91bmQsIG1pbi1oZWlnaHQvaGVpZ2h0IG9uIGh0bWwgZG9lc24ndCB3b3JrIGFzIGV4cGVjdGVkLFxyXG4gICAgLy8gZ2V0dGluZyBiaWdnZXIgdGhhbiB2aWV3cG9ydC5cclxuICAgIHZhciBpT1MgPSAvKGlQYWR8aVBob25lfGlQb2QpL2cudGVzdCggbmF2aWdhdG9yLnVzZXJBZ2VudCApO1xyXG4gICAgaWYgKGlPUykge1xyXG4gICAgICAgIHZhciBnZXRIZWlnaHQgPSBmdW5jdGlvbiBnZXRIZWlnaHQoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbiAgICAgICAgICAgIC8vIEluIGNhc2Ugb2YgZW5hYmxlIHRyYW5zcGFyZW50L292ZXJsYXkgU3RhdHVzQmFyOlxyXG4gICAgICAgICAgICAvLyAod2luZG93LmlubmVySGVpZ2h0IC0gKGlPc1dlYnZpZXcgPyAyMCA6IDApKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgJCgnaHRtbCcpLmhlaWdodChnZXRIZWlnaHQoKSArICdweCcpOyAgICAgICAgXHJcbiAgICAgICAgJCh3aW5kb3cpLm9uKCdsYXlvdXRVcGRhdGUnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgJCgnaHRtbCcpLmhlaWdodChnZXRIZWlnaHQoKSArICdweCcpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEJlY2F1c2Ugb2YgdGhlIGlPUzcrOCBidWdzIHdpdGggaGVpZ2h0IGNhbGN1bGF0aW9uLFxyXG4gICAgLy8gYSBkaWZmZXJlbnQgd2F5IG9mIGFwcGx5IGNvbnRlbnQgaGVpZ2h0IHRvIGZpbGwgYWxsIHRoZSBhdmFpbGFibGUgaGVpZ2h0IChhcyBtaW5pbXVtKVxyXG4gICAgLy8gaXMgcmVxdWlyZWQuXHJcbiAgICAvLyBGb3IgdGhhdCwgdGhlICdmdWxsLWhlaWdodCcgY2xhc3Mgd2FzIGFkZGVkLCB0byBiZSB1c2VkIGluIGVsZW1lbnRzIGluc2lkZSB0aGUgXHJcbiAgICAvLyBhY3Rpdml0eSB0aGF0IG5lZWRzIGFsbCB0aGUgYXZhaWxhYmxlIGhlaWdodCwgaGVyZSB0aGUgY2FsY3VsYXRpb24gaXMgYXBwbGllZCBmb3JcclxuICAgIC8vIGFsbCBwbGF0Zm9ybXMgZm9yIHRoaXMgaG9tb2dlbmVvdXMgYXBwcm9hY2ggdG8gc29sdmUgdGhlIHByb2JsZW1tLlxyXG4gICAgKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciAkYiA9ICQoJ2JvZHknKTtcclxuICAgICAgICB2YXIgZnVsbEhlaWdodCA9IGZ1bmN0aW9uIGZ1bGxIZWlnaHQoKSB7XHJcbiAgICAgICAgICAgIHZhciBoID0gJGIuaGVpZ2h0KCk7XHJcbiAgICAgICAgICAgICQoJy5mdWxsLWhlaWdodCcpXHJcbiAgICAgICAgICAgIC8vIExldCBicm93c2VyIHRvIGNvbXB1dGVcclxuICAgICAgICAgICAgLmNzcygnaGVpZ2h0JywgJ2F1dG8nKVxyXG4gICAgICAgICAgICAvLyBBcyBtaW5pbXVtXHJcbiAgICAgICAgICAgIC5jc3MoJ21pbi1oZWlnaHQnLCBoKVxyXG4gICAgICAgICAgICAvLyBTZXQgZXhwbGljaXQgdGhlIGF1dG9tYXRpYyBjb21wdXRlZCBoZWlnaHRcclxuICAgICAgICAgICAgLmNzcygnaGVpZ2h0JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAvLyB3ZSB1c2UgYm94LXNpemluZzpib3JkZXItYm94LCBzbyBuZWVkcyB0byBiZSBvdXRlckhlaWdodCB3aXRob3V0IG1hcmdpbjpcclxuICAgICAgICAgICAgICAgIHJldHVybiAkKHRoaXMpLm91dGVySGVpZ2h0KGZhbHNlKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgZnVsbEhlaWdodCgpO1xyXG4gICAgICAgICQod2luZG93KS5vbignbGF5b3V0VXBkYXRlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGZ1bGxIZWlnaHQoKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pKCk7XHJcbiAgICBcclxuICAgIC8vIEZvcmNlIGFuIHVwZGF0ZSBkZWxheWVkIHRvIGVuc3VyZSB1cGRhdGUgYWZ0ZXIgc29tZSB0aGluZ3MgZGlkIGFkZGl0aW9uYWwgd29ya1xyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAkKHdpbmRvdykudHJpZ2dlcignbGF5b3V0VXBkYXRlJyk7XHJcbiAgICB9LCAyMDApO1xyXG4gICAgXHJcbiAgICAvLyBCb290c3RyYXBcclxuICAgIHByZUJvb3RzdHJhcFdvcmthcm91bmRzKCk7XHJcbiAgICByZXF1aXJlKCdib290c3RyYXAnKTtcclxuICAgIFxyXG4gICAgLy8gTG9hZCBLbm9ja291dCBiaW5kaW5nIGhlbHBlcnNcclxuICAgIGJvb3Rrbm9jay5wbHVnSW4oa28pO1xyXG4gICAgcmVxdWlyZSgnLi91dGlscy9ib290c3RyYXBTd2l0Y2hCaW5kaW5nJykucGx1Z0luKGtvKTtcclxuICAgIFxyXG4gICAgLy8gUGx1Z2lucyBzZXR1cFxyXG4gICAgaWYgKHdpbmRvdy5jb3Jkb3ZhICYmIHdpbmRvdy5jb3Jkb3ZhLnBsdWdpbnMgJiYgd2luZG93LmNvcmRvdmEucGx1Z2lucy5LZXlib2FyZCkge1xyXG4gICAgICAgIHdpbmRvdy5jb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQuZGlzYWJsZVNjcm9sbCh0cnVlKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gRWFzeSBsaW5rcyB0byBzaGVsbCBhY3Rpb25zLCBsaWtlIGdvQmFjaywgaW4gaHRtbCBlbGVtZW50c1xyXG4gICAgLy8gRXhhbXBsZTogPGJ1dHRvbiBkYXRhLXNoZWxsPVwiZ29CYWNrIDJcIj5HbyAyIHRpbWVzIGJhY2s8L2J1dHRvbj5cclxuICAgIC8vIE5PVEU6IEltcG9ydGFudCwgcmVnaXN0ZXJlZCBiZWZvcmUgdGhlIHNoZWxsLnJ1biB0byBiZSBleGVjdXRlZFxyXG4gICAgLy8gYmVmb3JlIGl0cyAnY2F0Y2ggYWxsIGxpbmtzJyBoYW5kbGVyXHJcbiAgICAkKGRvY3VtZW50KS5vbigndGFwJywgJ1tkYXRhLXNoZWxsXScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAvLyBVc2luZyBhdHRyIHJhdGhlciB0aGFuIHRoZSAnZGF0YScgQVBJIHRvIGdldCB1cGRhdGVkXHJcbiAgICAgICAgLy8gRE9NIHZhbHVlc1xyXG4gICAgICAgIHZhciBjbWRsaW5lID0gJCh0aGlzKS5hdHRyKCdkYXRhLXNoZWxsJykgfHwgJycsXHJcbiAgICAgICAgICAgIGFyZ3MgPSBjbWRsaW5lLnNwbGl0KCcgJyksXHJcbiAgICAgICAgICAgIGNtZCA9IGFyZ3NbMF07XHJcblxyXG4gICAgICAgIGlmIChjbWQgJiYgdHlwZW9mKGFwcC5zaGVsbFtjbWRdKSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICBhcHAuc2hlbGxbY21kXS5hcHBseShhcHAuc2hlbGwsIGFyZ3Muc2xpY2UoMSkpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gQ2FuY2VsIGFueSBvdGhlciBhY3Rpb24gb24gdGhlIGxpbmssIHRvIGF2b2lkIGRvdWJsZSBsaW5raW5nIHJlc3VsdHNcclxuICAgICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBPbiBDb3Jkb3ZhL1Bob25lZ2FwIGFwcCwgc3BlY2lhbCB0YXJnZXRzIG11c3QgYmUgY2FsbGVkIHVzaW5nIHRoZSB3aW5kb3cub3BlblxyXG4gICAgLy8gQVBJIHRvIGVuc3VyZSBpcyBjb3JyZWN0bHkgb3BlbmVkIG9uIHRoZSBJbkFwcEJyb3dzZXIgKF9ibGFuaykgb3Igc3lzdGVtIGRlZmF1bHRcclxuICAgIC8vIGJyb3dzZXIgKF9zeXN0ZW0pLlxyXG4gICAgaWYgKHdpbmRvdy5jb3Jkb3ZhKSB7XHJcbiAgICAgICAgJChkb2N1bWVudCkub24oJ3RhcCcsICdbdGFyZ2V0PVwiX2JsYW5rXCJdLCBbdGFyZ2V0PVwiX3N5c3RlbVwiXScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgd2luZG93Lm9wZW4odGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSwgdGhpcy5nZXRBdHRyaWJ1dGUoJ3RhcmdldCcpKTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBXaGVuIGFuIGFjdGl2aXR5IGlzIHJlYWR5IGluIHRoZSBTaGVsbDpcclxuICAgIGFwcC5zaGVsbC5vbihhcHAuc2hlbGwuZXZlbnRzLml0ZW1SZWFkeSwgZnVuY3Rpb24oJGFjdCwgc3RhdGUpIHtcclxuICAgICAgICBcclxuICAgICAgICAvLyBDb25uZWN0IHRoZSAnYWN0aXZpdGllcycgY29udHJvbGxlcnMgdG8gdGhlaXIgdmlld3NcclxuICAgICAgICAvLyBHZXQgaW5pdGlhbGl6ZWQgYWN0aXZpdHkgZm9yIHRoZSBET00gZWxlbWVudFxyXG4gICAgICAgIHZhciBhY3ROYW1lID0gJGFjdC5kYXRhKCdhY3Rpdml0eScpO1xyXG4gICAgICAgIHZhciBhY3Rpdml0eSA9IGFwcC5nZXRBY3Rpdml0eShhY3ROYW1lKTtcclxuICAgICAgICAvLyBUcmlnZ2VyIHRoZSAnc2hvdycgbG9naWMgb2YgdGhlIGFjdGl2aXR5IGNvbnRyb2xsZXI6XHJcbiAgICAgICAgYWN0aXZpdHkuc2hvdyhzdGF0ZSk7XHJcblxyXG4gICAgICAgIC8vIFVwZGF0ZSBtZW51XHJcbiAgICAgICAgdmFyIG1lbnVJdGVtID0gYWN0aXZpdHkubWVudUl0ZW0gfHwgYWN0TmFtZTtcclxuICAgICAgICBhcHAudXBkYXRlTWVudShtZW51SXRlbSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVXBkYXRlIGFwcCBuYXZpZ2F0aW9uXHJcbiAgICAgICAgYXBwLnVwZGF0ZUFwcE5hdihhY3Rpdml0eSk7XHJcbiAgICB9KTtcclxuICAgIC8vIFdoZW4gYW4gYWN0aXZpdHkgaXMgaGlkZGVuXHJcbiAgICBhcHAuc2hlbGwub24oYXBwLnNoZWxsLmV2ZW50cy5jbG9zZWQsIGZ1bmN0aW9uKCRhY3QpIHtcclxuICAgICAgICBcclxuICAgICAgICAvLyBDb25uZWN0IHRoZSAnYWN0aXZpdGllcycgY29udHJvbGxlcnMgdG8gdGhlaXIgdmlld3NcclxuICAgICAgICB2YXIgYWN0TmFtZSA9ICRhY3QuZGF0YSgnYWN0aXZpdHknKTtcclxuICAgICAgICB2YXIgYWN0aXZpdHkgPSBhcHAuZ2V0QWN0aXZpdHkoYWN0TmFtZSk7XHJcbiAgICAgICAgLy8gVHJpZ2dlciB0aGUgJ2hpZGUnIGxvZ2ljIG9mIHRoZSBhY3Rpdml0eSBjb250cm9sbGVyOlxyXG4gICAgICAgIGlmIChhY3Rpdml0eS5oaWRlKVxyXG4gICAgICAgICAgICBhY3Rpdml0eS5oaWRlKCk7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gU2V0IG1vZGVsIGZvciB0aGUgQXBwTmF2XHJcbiAgICBrby5hcHBseUJpbmRpbmdzKHtcclxuICAgICAgICBuYXZCYXI6IGFwcC5uYXZCYXJcclxuICAgIH0sICQoJy5BcHBOYXYnKS5nZXQoMCkpO1xyXG4gICAgXHJcbiAgICB2YXIgU21hcnROYXZCYXIgPSByZXF1aXJlKCcuL2NvbXBvbmVudHMvU21hcnROYXZCYXInKTtcclxuICAgIHZhciBuYXZCYXJzID0gU21hcnROYXZCYXIuZ2V0QWxsKCk7XHJcbiAgICAvLyBDcmVhdGVzIGFuIGV2ZW50IGJ5IGxpc3RlbmluZyB0byBpdCwgc28gb3RoZXIgc2NyaXB0cyBjYW4gdHJpZ2dlclxyXG4gICAgLy8gYSAnY29udGVudENoYW5nZScgZXZlbnQgdG8gZm9yY2UgYSByZWZyZXNoIG9mIHRoZSBuYXZiYXIgKHRvIFxyXG4gICAgLy8gY2FsY3VsYXRlIGFuZCBhcHBseSBhIG5ldyBzaXplKTsgZXhwZWN0ZWQgZnJvbSBkeW5hbWljIG5hdmJhcnNcclxuICAgIC8vIHRoYXQgY2hhbmdlIGl0IGNvbnRlbnQgYmFzZWQgb24gb2JzZXJ2YWJsZXMuXHJcbiAgICBuYXZCYXJzLmZvckVhY2goZnVuY3Rpb24obmF2YmFyKSB7XHJcbiAgICAgICAgJChuYXZiYXIuZWwpLm9uKCdjb250ZW50Q2hhbmdlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIG5hdmJhci5yZWZyZXNoKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gTGlzdGVuIGZvciBtZW51IGV2ZW50cyAoY29sbGFwc2UgaW4gU21hcnROYXZCYXIpXHJcbiAgICAvLyB0byBhcHBseSB0aGUgYmFja2Ryb3BcclxuICAgIHZhciB0b2dnbGluZ0JhY2tkcm9wID0gZmFsc2U7XHJcbiAgICAkKGRvY3VtZW50KS5vbignc2hvdy5icy5jb2xsYXBzZSBoaWRlLmJzLmNvbGxhcHNlJywgJy5BcHBOYXYgLm5hdmJhci1jb2xsYXBzZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBpZiAoIXRvZ2dsaW5nQmFja2Ryb3ApIHtcclxuICAgICAgICAgICAgdG9nZ2xpbmdCYWNrZHJvcCA9IHRydWU7XHJcbiAgICAgICAgICAgIHZhciBlbmFibGVkID0gZS50eXBlID09PSAnc2hvdyc7XHJcbiAgICAgICAgICAgICQoJ2JvZHknKS50b2dnbGVDbGFzcygndXNlLWJhY2tkcm9wJywgZW5hYmxlZCk7XHJcbiAgICAgICAgICAgIC8vIEhpZGUgYW55IG90aGVyIG9wZW5lZCBjb2xsYXBzZVxyXG4gICAgICAgICAgICAkKCcuY29sbGFwc2luZywgLmNvbGxhcHNlLmluJykuY29sbGFwc2UoJ2hpZGUnKTtcclxuICAgICAgICAgICAgdG9nZ2xpbmdCYWNrZHJvcCA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEFwcCBpbml0OlxyXG4gICAgdmFyIGFsZXJ0RXJyb3IgPSBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICB3aW5kb3cuYWxlcnQoJ1RoZXJlIHdhcyBhbiBlcnJvciBsb2FkaW5nOiAnICsgZXJyICYmIGVyci5tZXNzYWdlIHx8IGVycik7XHJcbiAgICB9O1xyXG5cclxuICAgIGFwcC5tb2RlbC5pbml0KClcclxuICAgIC50aGVuKGFwcC5zaGVsbC5ydW4uYmluZChhcHAuc2hlbGwpLCBhbGVydEVycm9yKVxyXG4gICAgLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgLy8gTWFyayB0aGUgcGFnZSBhcyByZWFkeVxyXG4gICAgICAgICQoJ2h0bWwnKS5hZGRDbGFzcygnaXMtcmVhZHknKTtcclxuICAgICAgICAvLyBBcyBhcHAsIGhpZGVzIHNwbGFzaCBzY3JlZW5cclxuICAgICAgICBpZiAod2luZG93Lm5hdmlnYXRvciAmJiB3aW5kb3cubmF2aWdhdG9yLnNwbGFzaHNjcmVlbikge1xyXG4gICAgICAgICAgICB3aW5kb3cubmF2aWdhdG9yLnNwbGFzaHNjcmVlbi5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgYWxlcnRFcnJvcik7XHJcblxyXG4gICAgLy8gREVCVUdcclxuICAgIHdpbmRvdy5hcHAgPSBhcHA7XHJcbn07XHJcblxyXG4vLyBBcHAgaW5pdCBvbiBwYWdlIHJlYWR5IGFuZCBwaG9uZWdhcCByZWFkeVxyXG5pZiAod2luZG93LmNvcmRvdmEpIHtcclxuICAgIC8vIE9uIERPTS1SZWFkeSBmaXJzdFxyXG4gICAgJChmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBQYWdlIGlzIHJlYWR5LCBkZXZpY2UgaXMgdG9vP1xyXG4gICAgICAgIC8vIE5vdGU6IENvcmRvdmEgZW5zdXJlcyB0byBjYWxsIHRoZSBoYW5kbGVyIGV2ZW4gaWYgdGhlXHJcbiAgICAgICAgLy8gZXZlbnQgd2FzIGFscmVhZHkgZmlyZWQsIHNvIGlzIGdvb2QgdG8gZG8gaXQgaW5zaWRlXHJcbiAgICAgICAgLy8gdGhlIGRvbS1yZWFkeSBhbmQgd2UgYXJlIGVuc3VyaW5nIHRoYXQgZXZlcnl0aGluZyBpc1xyXG4gICAgICAgIC8vIHJlYWR5LlxyXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdkZXZpY2VyZWFkeScsIGFwcEluaXQpO1xyXG4gICAgfSk7XHJcbn0gZWxzZSB7XHJcbiAgICAvLyBPbmx5IG9uIERPTS1SZWFkeSwgZm9yIGluIGJyb3dzZXIgZGV2ZWxvcG1lbnRcclxuICAgICQoYXBwSW5pdCk7XHJcbn1cclxuIiwiLyoqXHJcbiAgICBBY2Nlc3MgdG8gdXNlIGdsb2JhbCBBcHAgTW9kYWxzXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuLyoqXHJcbiAgICBHZW5lcmF0ZXMgYSB0ZXh0IG1lc3NhZ2UsIHdpdGggbmV3bGluZXMgaWYgbmVlZGVkLCBkZXNjcmliaW5nIHRoZSBlcnJvclxyXG4gICAgb2JqZWN0IHBhc3NlZC5cclxuICAgIEBwYXJhbSBlcnI6YW55IEFzIGEgc3RyaW5nLCBpcyByZXR1cm5lZCAnYXMgaXMnOyBhcyBmYWxzeSwgaXQgcmV0dXJuIGEgZ2VuZXJpY1xyXG4gICAgbWVzc2FnZSBmb3IgJ3Vua25vdyBlcnJvcic7IGFzIG9iamVjdCwgaXQgaW52ZXN0aWdhdGUgd2hhdCB0eXBlIG9mIGVycm9yIGlzIHRvXHJcbiAgICBwcm92aWRlIHRoZSBtb3JlIG1lYW5pbmZ1bCByZXN1bHQsIHdpdGggZmFsbGJhY2sgdG8gSlNPTi5zdHJpbmdpZnkgcHJlZml4ZWRcclxuICAgIHdpdGggJ1RlY2huaWNhbCBkZXRhaWxzOicuXHJcbiAgICBPYmplY3RzIHJlY29nbml6ZWQ6XHJcbiAgICAtIFhIUi9qUXVlcnkgZm9yIEpTT04gcmVzcG9uc2VzOiBqdXN0IG9iamVjdHMgd2l0aCByZXNwb25zZUpTT04gcHJvcGVydHksIGlzXHJcbiAgICAgIHVzZWQgYXMgdGhlICdlcnInIG9iamVjdCBhbmQgcGFzc2VkIHRvIHRoZSBvdGhlciBvYmplY3QgdGVzdHMuXHJcbiAgICAtIE9iamVjdCB3aXRoICdlcnJvck1lc3NhZ2UnIChzZXJ2ZXItc2lkZSBmb3JtYXR0ZWQgZXJyb3IpLlxyXG4gICAgLSBPYmplY3Qgd2l0aCAnbWVzc2FnZScgcHJvcGVydHksIGxpa2UgdGhlIHN0YW5kYXJkIEVycm9yIGNsYXNzIGFuZCBFeGNlcHRpb24gb2JqZWN0cy5cclxuICAgIC0gT2JqZWN0IHdpdGggJ25hbWUnIHByb3BlcnR5LCBsaWtlIHRoZSBzdGFuZGFyZCBFeGNlcHRpb24gb2JqZWN0cy4gVGhlIG5hbWUsIGlmIGFueSxcclxuICAgICAgaXMgc2V0IGFzIHByZWZpeCBmb3IgdGhlICdtZXNzYWdlJyBwcm9wZXJ0eSB2YWx1ZS5cclxuICAgIC0gT2JqZWN0IHdpdGggJ2Vycm9ycycgcHJvcGVydHkuIEVhY2ggZWxlbWVudCBpbiB0aGUgYXJyYXkgb3Igb2JqZWN0IG93biBrZXlzXHJcbiAgICAgIGlzIGFwcGVuZGVkIHRvIHRoZSBlcnJvck1lc3NhZ2Ugb3IgbWVzc2FnZSBzZXBhcmF0ZWQgYnkgbmV3bGluZS5cclxuKiovXHJcbmV4cG9ydHMuZ2V0RXJyb3JNZXNzYWdlRnJvbSA9IGZ1bmN0aW9uIGdldEVycm9yTWVzc2FnZUZyb20oZXJyKSB7XHJcbiAgICAvKmpzaGludCBtYXhjb21wbGV4aXR5OjEwKi9cclxuXHJcbiAgICBpZiAoIWVycikge1xyXG4gICAgICAgIHJldHVybiAnVW5rbm93IGVycm9yJztcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZihlcnIpID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgIHJldHVybiBlcnI7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICAvLyBJZiBpcyBhIFhIUiBvYmplY3QsIHVzZSBpdHMgcmVzcG9uc2UgYXMgdGhlIGVycm9yLlxyXG4gICAgICAgIGVyciA9IGVyci5yZXNwb25zZUpTT04gfHwgZXJyO1xyXG5cclxuICAgICAgICB2YXIgbXNnID0gZXJyLm5hbWUgJiYgKGVyci5uYW1lICsgJzogJykgfHwgJyc7XHJcbiAgICAgICAgbXNnICs9IGVyci5lcnJvck1lc3NhZ2UgfHwgZXJyLm1lc3NhZ2UgfHwgJyc7XHJcblxyXG4gICAgICAgIGlmIChlcnIuZXJyb3JzKSB7XHJcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGVyci5lcnJvcnMpKSB7XHJcbiAgICAgICAgICAgICAgICBtc2cgKz0gJ1xcbicgKyBlcnIuZXJyb3JzLmpvaW4oJ1xcbicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoZXJyLmVycm9ycykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICBtc2cgKz0gJ1xcbicgKyBlcnIuZXJyb3JzW2tleV0uam9pbignXFxuJyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgbXNnICs9ICdcXG5UZWNobmljYWwgZGV0YWlsczogJyArIEpTT04uc3RyaW5naWZ5KGVycik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbXNnO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0cy5zaG93RXJyb3IgPSBmdW5jdGlvbiBzaG93RXJyb3JNb2RhbChvcHRpb25zKSB7XHJcbiAgICBcclxuICAgIHZhciBtb2RhbCA9ICQoJyNlcnJvck1vZGFsJyksXHJcbiAgICAgICAgaGVhZGVyID0gbW9kYWwuZmluZCgnI2Vycm9yTW9kYWwtbGFiZWwnKSxcclxuICAgICAgICBib2R5ID0gbW9kYWwuZmluZCgnI2Vycm9yTW9kYWwtYm9keScpO1xyXG4gICAgXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIFxyXG4gICAgdmFyIG1zZyA9IGJvZHkuZGF0YSgnZGVmYXVsdC10ZXh0Jyk7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuZXJyb3IpXHJcbiAgICAgICAgbXNnID0gZXhwb3J0cy5nZXRFcnJvck1lc3NhZ2VGcm9tKG9wdGlvbnMuZXJyb3IpO1xyXG4gICAgZWxzZSBpZiAob3B0aW9ucy5tZXNzYWdlKVxyXG4gICAgICAgIG1zZyA9IG9wdGlvbnMubWVzc2FnZTtcclxuXHJcbiAgICBib2R5Lm11bHRpbGluZShtc2cpO1xyXG5cclxuICAgIGhlYWRlci50ZXh0KG9wdGlvbnMudGl0bGUgfHwgaGVhZGVyLmRhdGEoJ2RlZmF1bHQtdGV4dCcpKTtcclxuICAgIFxyXG4gICAgbW9kYWwubW9kYWwoJ3Nob3cnKTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBTZXR1cCBvZiB0aGUgc2hlbGwgb2JqZWN0IHVzZWQgYnkgdGhlIGFwcFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGJhc2VVcmwgPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XHJcblxyXG4vL3ZhciBIaXN0b3J5ID0gcmVxdWlyZSgnLi9hcHAtc2hlbGwtaGlzdG9yeScpLmNyZWF0ZShiYXNlVXJsKTtcclxudmFyIEhpc3RvcnkgPSByZXF1aXJlKCcuL3V0aWxzL3NoZWxsL2hhc2hiYW5nSGlzdG9yeScpO1xyXG5cclxuLy8gU2hlbGwgZGVwZW5kZW5jaWVzXHJcbnZhciBzaGVsbCA9IHJlcXVpcmUoJy4vdXRpbHMvc2hlbGwvaW5kZXgnKSxcclxuICAgIFNoZWxsID0gc2hlbGwuU2hlbGwsXHJcbiAgICBEb21JdGVtc01hbmFnZXIgPSBzaGVsbC5Eb21JdGVtc01hbmFnZXI7XHJcblxyXG52YXIgaU9TID0gLyhpUGFkfGlQaG9uZXxpUG9kKS9nLnRlc3QoIG5hdmlnYXRvci51c2VyQWdlbnQgKTtcclxuXHJcbi8vIENyZWF0aW5nIHRoZSBzaGVsbDpcclxudmFyIHNoZWxsID0gbmV3IFNoZWxsKHtcclxuXHJcbiAgICAvLyBTZWxlY3RvciwgRE9NIGVsZW1lbnQgb3IgalF1ZXJ5IG9iamVjdCBwb2ludGluZ1xyXG4gICAgLy8gdGhlIHJvb3Qgb3IgY29udGFpbmVyIGZvciB0aGUgc2hlbGwgaXRlbXNcclxuICAgIHJvb3Q6ICdib2R5JyxcclxuXHJcbiAgICAvLyBJZiBpcyBub3QgaW4gdGhlIHNpdGUgcm9vdCwgdGhlIGJhc2UgVVJMIGlzIHJlcXVpcmVkOlxyXG4gICAgYmFzZVVybDogYmFzZVVybCxcclxuICAgIFxyXG4gICAgZm9yY2VIYXNoYmFuZzogdHJ1ZSxcclxuXHJcbiAgICBpbmRleE5hbWU6ICdpbmRleCcsXHJcblxyXG4gICAgLy8gV09SS0FST1VORDogVXNpbmcgdGhlICd0YXAnIGV2ZW50IGZvciBmYXN0ZXIgbW9iaWxlIGV4cGVyaWVuY2VcclxuICAgIC8vIChmcm9tIGpxdWVyeS1tb2JpbGUgZXZlbnQpIG9uIGlPUyBkZXZpY2VzLCBidXQgbGVmdFxyXG4gICAgLy8gJ2NsaWNrJyBvbiBvdGhlcnMgc2luY2UgdGhleSBoYXMgbm90IHRoZSBzbG93LWNsaWNrIHByb2JsZW1cclxuICAgIC8vIHRoYW5rcyB0byB0aGUgbWV0YS12aWV3cG9ydC5cclxuICAgIC8vIFdPUktBUk9VTkQ6IElNUE9SVEFOVCwgdXNpbmcgJ2NsaWNrJyByYXRoZXIgdGhhbiAndGFwJyBvbiBBbmRyb2lkXHJcbiAgICAvLyBwcmV2ZW50cyBhbiBhcHAgY3Jhc2ggKG9yIGdvIG91dCBhbmQgcGFnZSBub3QgZm91bmQgb24gQ2hyb21lIGZvciBBbmRyb2lkKVxyXG4gICAgLy8gYmVjYXVzZSBvZiBzb21lICdjbGlja3MnIGhhcHBlbmluZyBvblxyXG4gICAgLy8gYSBoYWxmLWxpbmstZWxlbWVudCB0YXAsIHdoZXJlIHRoZSAndGFwJyBldmVudCBkZXRlY3RzIGFzIHRhcmdldCB0aGUgbm9uLWxpbmsgYW5kIHRoZVxyXG4gICAgLy8gbGluayBnZXRzIGV4ZWN1dGVkIGFueXdheSBieSB0aGUgYnJvd3Nlciwgbm90IGNhdGNoZWQgc28gV2VidmlldyBtb3ZlcyB0byBcclxuICAgIC8vIGEgbm9uIGV4aXN0YW50IGZpbGUgKGFuZCB0aGF0cyBtYWtlIFBob25lR2FwIHRvIGNyYXNoKS5cclxuICAgIGxpbmtFdmVudDogaU9TID8gJ3RhcCcgOiAnY2xpY2snLFxyXG5cclxuICAgIC8vIE5vIG5lZWQgZm9yIGxvYWRlciwgZXZlcnl0aGluZyBjb21lcyBidW5kbGVkXHJcbiAgICBsb2FkZXI6IG51bGwsXHJcblxyXG4gICAgLy8gSGlzdG9yeSBQb2x5ZmlsbDpcclxuICAgIGhpc3Rvcnk6IEhpc3RvcnksXHJcblxyXG4gICAgLy8gQSBEb21JdGVtc01hbmFnZXIgb3IgZXF1aXZhbGVudCBvYmplY3QgaW5zdGFuY2UgbmVlZHMgdG9cclxuICAgIC8vIGJlIHByb3ZpZGVkOlxyXG4gICAgZG9tSXRlbXNNYW5hZ2VyOiBuZXcgRG9tSXRlbXNNYW5hZ2VyKHtcclxuICAgICAgICBpZEF0dHJpYnV0ZU5hbWU6ICdkYXRhLWFjdGl2aXR5J1xyXG4gICAgfSlcclxufSk7XHJcblxyXG4vLyBDYXRjaCBlcnJvcnMgb24gaXRlbS9wYWdlIGxvYWRpbmcsIHNob3dpbmcuLlxyXG5zaGVsbC5vbignZXJyb3InLCBmdW5jdGlvbihlcnIpIHtcclxuICAgIFxyXG4gICAgdmFyIHN0ciA9ICdVbmtub3cgZXJyb3InO1xyXG4gICAgaWYgKGVycikge1xyXG4gICAgICAgIGlmICh0eXBlb2YoZXJyKSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgc3RyID0gZXJyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChlcnIubWVzc2FnZSkge1xyXG4gICAgICAgICAgICBzdHIgPSBlcnIubWVzc2FnZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHN0ciA9IEpTT04uc3RyaW5naWZ5KGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFRPRE8gY2hhbmdlIHdpdGggYSBkaWFsb2cgb3Igc29tZXRoaW5nXHJcbiAgICB3aW5kb3cuYWxlcnQoc3RyKTtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNoZWxsO1xyXG4iLCIvKipcclxuICAgIEFjdGl2aXR5IGJhc2UgY2xhc3NcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpLFxyXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKTtcclxuXHJcbnJlcXVpcmUoJy4uL3V0aWxzL0Z1bmN0aW9uLnByb3RvdHlwZS5faW5oZXJpdHMnKTtcclxuXHJcbi8qKlxyXG4gICAgQWN0aXZpdHkgY2xhc3MgZGVmaW5pdGlvblxyXG4qKi9cclxuZnVuY3Rpb24gQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcclxuICAgIHRoaXMuYXBwID0gYXBwO1xyXG5cclxuICAgIC8vIERlZmF1bHQgYWNjZXNzIGxldmVsOiBhbnlvbmVcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuTm9uZTtcclxuICAgIFxyXG4gICAgLy8gVE9ETzogRnV0dXJlIHVzZSBvZiBhIHZpZXdTdGF0ZSwgcGxhaW4gb2JqZWN0IHJlcHJlc2VudGF0aW9uXHJcbiAgICAvLyBvZiBwYXJ0IG9mIHRoZSB2aWV3TW9kZWwgdG8gYmUgdXNlZCBhcyB0aGUgc3RhdGUgcGFzc2VkIHRvIHRoZVxyXG4gICAgLy8gaGlzdG9yeSBhbmQgYmV0d2VlbiBhY3Rpdml0aWVzIGNhbGxzLlxyXG4gICAgdGhpcy52aWV3U3RhdGUgPSB7fTtcclxuICAgIFxyXG4gICAgLy8gT2JqZWN0IHRvIGhvbGQgdGhlIG9wdGlvbnMgcGFzc2VkIG9uICdzaG93JyBhcyBhIHJlc3VsdFxyXG4gICAgLy8gb2YgYSByZXF1ZXN0IGZyb20gYW5vdGhlciBhY3Rpdml0eVxyXG4gICAgdGhpcy5yZXF1ZXN0RGF0YSA9IG51bGw7XHJcblxyXG4gICAgLy8gRGVmYXVsdCBuYXZCYXIgb2JqZWN0LlxyXG4gICAgdGhpcy5uYXZCYXIgPSBuZXcgTmF2QmFyKHtcclxuICAgICAgICB0aXRsZTogbnVsbCwgLy8gbnVsbCBmb3IgbG9nb1xyXG4gICAgICAgIGxlZnRBY3Rpb246IG51bGwsXHJcbiAgICAgICAgcmlnaHRBY3Rpb246IG51bGxcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBEZWxheWVkIGJpbmRpbmdzIHRvIGFsbG93IGZvciBmdXJ0aGVyIGNvbnN0cnVjdG9yIHNldC11cCBcclxuICAgIC8vIG9uIHN1YmNsYXNzZXMuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uIEFjdGl2aXR5Q29uc3RydWN0b3JEZWxheWVkKCkge1xyXG4gICAgICAgIC8vIEEgdmlldyBtb2RlbCBhbmQgYmluZGluZ3MgYmVpbmcgYXBwbGllZCBpcyBldmVyIHJlcXVpcmVkXHJcbiAgICAgICAgLy8gZXZlbiBvbiBBY3Rpdml0aWVzIHdpdGhvdXQgbmVlZCBmb3IgYSB2aWV3IG1vZGVsLCBzaW5jZVxyXG4gICAgICAgIC8vIHRoZSB1c2Ugb2YgY29tcG9uZW50cyBhbmQgdGVtcGxhdGVzLCBvciBhbnkgb3RoZXIgZGF0YS1iaW5kXHJcbiAgICAgICAgLy8gc3ludGF4LCByZXF1aXJlcyB0byBiZSBpbiBhIGNvbnRleHQgd2l0aCBiaW5kaW5nIGVuYWJsZWQ6XHJcbiAgICAgICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLnZpZXdNb2RlbCB8fCB7fSwgJGFjdGl2aXR5LmdldCgwKSk7XHJcbiAgICB9LmJpbmQodGhpcyksIDEpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFjdGl2aXR5O1xyXG5cclxuLyoqXHJcbiAgICBTZXQtdXAgdmlzdWFsaXphdGlvbiBvZiB0aGUgdmlldyB3aXRoIHRoZSBnaXZlbiBvcHRpb25zL3N0YXRlLFxyXG4gICAgd2l0aCBhIHJlc2V0IG9mIGN1cnJlbnQgc3RhdGUuXHJcbiAgICBNdXN0IGJlIGV4ZWN1dGVkIGV2ZXJ5IHRpbWUgdGhlIGFjdGl2aXR5IGlzIHB1dCBpbiB0aGUgY3VycmVudCB2aWV3LlxyXG4qKi9cclxuQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcclxuICAgIC8vIFRPRE86IG11c3Qga2VlcCB2aWV3U3RhdGUgdXAgdG8gZGF0ZSB1c2luZyBvcHRpb25zL3N0YXRlLlxyXG4gICAgXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIHRoaXMucmVxdWVzdERhdGEgPSBvcHRpb25zO1xyXG4gICAgXHJcbiAgICAvLyBFbmFibGUgcmVnaXN0ZXJlZCBoYW5kbGVyc1xyXG4gICAgLy8gVmFsaWRhdGlvbiBvZiBlYWNoIHNldHRpbmdzIG9iamVjdCBpcyBwZXJmb3JtZWRcclxuICAgIC8vIG9uIHJlZ2lzdGVyZWQsIGF2b2lkZWQgaGVyZS5cclxuICAgIGlmICh0aGlzLl9oYW5kbGVycyAmJlxyXG4gICAgICAgIHRoaXMuX2hhbmRsZXJzQXJlQ29ubmVjdGVkICE9PSB0cnVlKSB7XHJcbiAgICAgICAgdGhpcy5faGFuZGxlcnMuZm9yRWFjaChmdW5jdGlvbihzZXR0aW5ncykge1xyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiBpcyBhbiBvYnNlcnZhYmxlIHN1YnNjcmlwdGlvblxyXG4gICAgICAgICAgICBpZiAoIXNldHRpbmdzLmV2ZW50ICYmIHNldHRpbmdzLnRhcmdldC5zdWJzY3JpYmUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBzdWJzY3JpcHRpb24gPSBzZXR0aW5ncy50YXJnZXQuc3Vic2NyaWJlKHNldHRpbmdzLmhhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgLy8gT2JzZXJ2YWJsZXMgaGFzIG5vdCBhICd1bnN1YnNjcmliZScgZnVuY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAvLyB0aGV5IHJldHVybiBhbiBvYmplY3QgdGhhdCBtdXN0IGJlICdkaXNwb3NlZCcuXHJcbiAgICAgICAgICAgICAgICAvLyBTYXZpbmcgdGhhdCB3aXRoIHNldHRpbmdzIHRvIGFsbG93ICd1bnN1YnNjcmliZScgbGF0ZXIuXHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5fc3Vic2NyaXB0aW9uID0gc3Vic2NyaXB0aW9uO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIElubWVkaWF0ZSBleGVjdXRpb246IGlmIGN1cnJlbnQgb2JzZXJ2YWJsZSB2YWx1ZSBpcyBkaWZmZXJlbnRcclxuICAgICAgICAgICAgICAgIC8vIHRoYW4gcHJldmlvdXMgb25lLCBleGVjdXRlIHRoZSBoYW5kbGVyOlxyXG4gICAgICAgICAgICAgICAgLy8gKHRoaXMgYXZvaWQgdGhhdCBhIGNoYW5nZWQgc3RhdGUgZ2V0IG9taXR0ZWQgYmVjYXVzZSBoYXBwZW5lZFxyXG4gICAgICAgICAgICAgICAgLy8gd2hlbiBzdWJzY3JpcHRpb24gd2FzIG9mZjsgaXQgbWVhbnMgYSBmaXJzdCB0aW1lIGV4ZWN1dGlvbiB0b28pLlxyXG4gICAgICAgICAgICAgICAgLy8gTk9URTogJ3VuZGVmaW5lZCcgdmFsdWUgb24gb2JzZXJ2YWJsZSBtYXkgY2F1c2UgdGhpcyB0byBmYWxsXHJcbiAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3MuX2xhdGVzdFN1YnNjcmliZWRWYWx1ZSAhPT0gc2V0dGluZ3MudGFyZ2V0KCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXR0aW5ncy5oYW5kbGVyLmNhbGwoc2V0dGluZ3MudGFyZ2V0LCBzZXR0aW5ncy50YXJnZXQoKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoc2V0dGluZ3Muc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIHNldHRpbmdzLnRhcmdldC5vbihzZXR0aW5ncy5ldmVudCwgc2V0dGluZ3Muc2VsZWN0b3IsIHNldHRpbmdzLmhhbmRsZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2V0dGluZ3MudGFyZ2V0Lm9uKHNldHRpbmdzLmV2ZW50LCBzZXR0aW5ncy5oYW5kbGVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIFRvIGF2b2lkIGRvdWJsZSBjb25uZWN0aW9uczpcclxuICAgICAgICAvLyBOT1RFOiBtYXkgaGFwcGVuIHRoYXQgJ3Nob3cnIGdldHMgY2FsbGVkIHNldmVyYWwgdGltZXMgd2l0aG91dCBhICdoaWRlJ1xyXG4gICAgICAgIC8vIGluIGJldHdlZW4sIGJlY2F1c2UgJ3Nob3cnIGFjdHMgYXMgYSByZWZyZXNoZXIgcmlnaHQgbm93IGV2ZW4gZnJvbSBzZWdtZW50XHJcbiAgICAgICAgLy8gY2hhbmdlcyBmcm9tIHRoZSBzYW1lIGFjdGl2aXR5LlxyXG4gICAgICAgIHRoaXMuX2hhbmRsZXJzQXJlQ29ubmVjdGVkID0gdHJ1ZTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gICAgUGVyZm9ybSB0YXNrcyB0byBzdG9wIGFueXRoaW5nIHJ1bm5pbmcgb3Igc3RvcCBoYW5kbGVycyBmcm9tIGxpc3RlbmluZy5cclxuICAgIE11c3QgYmUgZXhlY3V0ZWQgZXZlcnkgdGltZSB0aGUgYWN0aXZpdHkgaXMgaGlkZGVuL3JlbW92ZWQgXHJcbiAgICBmcm9tIHRoZSBjdXJyZW50IHZpZXcuXHJcbioqL1xyXG5BY3Rpdml0eS5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uIGhpZGUoKSB7XHJcbiAgICBcclxuICAgIC8vIERpc2FibGUgcmVnaXN0ZXJlZCBoYW5kbGVyc1xyXG4gICAgaWYgKHRoaXMuX2hhbmRsZXJzKSB7XHJcbiAgICAgICAgdGhpcy5faGFuZGxlcnMuZm9yRWFjaChmdW5jdGlvbihzZXR0aW5ncykge1xyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiBpcyBhbiBvYnNlcnZhYmxlIHN1YnNjcmlwdGlvblxyXG4gICAgICAgICAgICBpZiAoc2V0dGluZ3MuX3N1YnNjcmlwdGlvbikge1xyXG4gICAgICAgICAgICAgICAgc2V0dGluZ3MuX3N1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAvLyBTYXZlIGxhdGVzdCBvYnNlcnZhYmxlIHZhbHVlIHRvIG1ha2UgYSBjb21wYXJpc2lvblxyXG4gICAgICAgICAgICAgICAgLy8gbmV4dCB0aW1lIGlzIGVuYWJsZWQgdG8gZW5zdXJlIGlzIGV4ZWN1dGVkIGlmIHRoZXJlIHdhc1xyXG4gICAgICAgICAgICAgICAgLy8gYSBjaGFuZ2Ugd2hpbGUgZGlzYWJsZWQ6XHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5fbGF0ZXN0U3Vic2NyaWJlZFZhbHVlID0gc2V0dGluZ3MudGFyZ2V0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoc2V0dGluZ3MudGFyZ2V0Lm9mZikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzLnNlbGVjdG9yKVxyXG4gICAgICAgICAgICAgICAgICAgIHNldHRpbmdzLnRhcmdldC5vZmYoc2V0dGluZ3MuZXZlbnQsIHNldHRpbmdzLnNlbGVjdG9yLCBzZXR0aW5ncy5oYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICBzZXR0aW5ncy50YXJnZXQub2ZmKHNldHRpbmdzLmV2ZW50LCBzZXR0aW5ncy5oYW5kbGVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHNldHRpbmdzLnRhcmdldC5yZW1vdmVMaXN0ZW5lcihzZXR0aW5ncy5ldmVudCwgc2V0dGluZ3MuaGFuZGxlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLl9oYW5kbGVyc0FyZUNvbm5lY3RlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAgICBSZWdpc3RlciBhIGhhbmRsZXIgdGhhdCBhY3RzIG9uIGFuIGV2ZW50IG9yIHN1YnNjcmlwdGlvbiBub3RpZmljYXRpb24sXHJcbiAgICB0aGF0IHdpbGwgYmUgZW5hYmxlZCBvbiBBY3Rpdml0eS5zaG93IGFuZCBkaXNhYmxlZCBvbiBBY3Rpdml0eS5oaWRlLlxyXG5cclxuICAgIEBwYXJhbSBzZXR0aW5nczpvYmplY3Qge1xyXG4gICAgICAgIHRhcmdldDogalF1ZXJ5LCBFdmVudEVtaXR0ZXIsIEtub2Nrb3V0Lm9ic2VydmFibGUuIFJlcXVpcmVkXHJcbiAgICAgICAgZXZlbnQ6IHN0cmluZy4gRXZlbnQgbmFtZSAoY2FuIGhhdmUgbmFtZXNwYWNlcywgc2V2ZXJhbCBldmVudHMgYWxsb3dlZCkuIEl0cyByZXF1aXJlZCBleGNlcHQgd2hlbiB0aGUgdGFyZ2V0IGlzIGFuIG9ic2VydmFibGUsIHRoZXJlIG11c3RcclxuICAgICAgICAgICAgYmUgb21pdHRlZC5cclxuICAgICAgICBoYW5kbGVyOiBGdW5jdGlvbi4gUmVxdWlyZWQsXHJcbiAgICAgICAgc2VsZWN0b3I6IHN0cmluZy4gT3B0aW9uYWwuIEZvciBqUXVlcnkgZXZlbnRzIG9ubHksIHBhc3NlZCBhcyB0aGVcclxuICAgICAgICAgICAgc2VsZWN0b3IgZm9yIGRlbGVnYXRlZCBoYW5kbGVycy5cclxuICAgIH1cclxuKiovXHJcbkFjdGl2aXR5LnByb3RvdHlwZS5yZWdpc3RlckhhbmRsZXIgPSBmdW5jdGlvbiByZWdpc3RlckhhbmRsZXIoc2V0dGluZ3MpIHtcclxuICAgIC8qanNoaW50IG1heGNvbXBsZXhpdHk6OCAqL1xyXG4gICAgXHJcbiAgICBpZiAoIXNldHRpbmdzKVxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUmVnaXN0ZXIgcmVxdWlyZSBhIHNldHRpbmdzIG9iamVjdCcpO1xyXG4gICAgXHJcbiAgICBpZiAoIXNldHRpbmdzLnRhcmdldCB8fCAoIXNldHRpbmdzLnRhcmdldC5vbiAmJiAhc2V0dGluZ3MudGFyZ2V0LnN1YnNjcmliZSkpXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUYXJnZXQgaXMgbnVsbCBvciBub3QgYSBqUXVlcnksIEV2ZW50RW1taXRlciBvciBPYnNlcnZhYmxlIG9iamVjdCcpO1xyXG4gICAgXHJcbiAgICBpZiAodHlwZW9mKHNldHRpbmdzLmhhbmRsZXIpICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdIYW5kbGVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgaWYgKCFzZXR0aW5ncy5ldmVudCAmJiAhc2V0dGluZ3MudGFyZ2V0LnN1YnNjcmliZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRXZlbnQgaXMgbnVsbDsgaXRcXCdzIHJlcXVpcmVkIGZvciBub24gb2JzZXJ2YWJsZSBvYmplY3RzJyk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5faGFuZGxlcnMgPSB0aGlzLl9oYW5kbGVycyB8fCBbXTtcclxuXHJcbiAgICB0aGlzLl9oYW5kbGVycy5wdXNoKHNldHRpbmdzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgU3RhdGljIHV0aWxpdGllc1xyXG4qKi9cclxuLy8gRm9yIGNvbW1vZGl0eSwgY29tbW9uIGNsYXNzZXMgYXJlIGV4cG9zZWQgYXMgc3RhdGljIHByb3BlcnRpZXNcclxuQWN0aXZpdHkuTmF2QmFyID0gTmF2QmFyO1xyXG5BY3Rpdml0eS5OYXZBY3Rpb24gPSBOYXZBY3Rpb247XHJcblxyXG4vLyBRdWljayBjcmVhdGlvbiBvZiBjb21tb24gdHlwZXMgb2YgTmF2QmFyXHJcbkFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIgPSBmdW5jdGlvbiBjcmVhdGVTZWN0aW9uTmF2QmFyKHRpdGxlKSB7XHJcbiAgICByZXR1cm4gbmV3IE5hdkJhcih7XHJcbiAgICAgICAgdGl0bGU6IHRpdGxlLFxyXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5tZW51TmV3SXRlbSxcclxuICAgICAgICByaWdodEFjdGlvbjogTmF2QWN0aW9uLm1lbnVJblxyXG4gICAgfSk7XHJcbn07XHJcblxyXG5BY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyID0gZnVuY3Rpb24gY3JlYXRlU3Vic2VjdGlvbk5hdkJhcih0aXRsZSwgb3B0aW9ucykge1xyXG4gICAgXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIFxyXG4gICAgdmFyIGdvQmFja09wdGlvbnMgPSB7XHJcbiAgICAgICAgdGV4dDogdGl0bGUsXHJcbiAgICAgICAgaXNUaXRsZTogdHJ1ZVxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5iYWNrTGluaykge1xyXG4gICAgICAgIGdvQmFja09wdGlvbnMubGluayA9IG9wdGlvbnMuYmFja0xpbms7XHJcbiAgICAgICAgZ29CYWNrT3B0aW9ucy5pc1NoZWxsID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBOYXZCYXIoe1xyXG4gICAgICAgIHRpdGxlOiAnJywgLy8gTm8gdGl0bGVcclxuICAgICAgICBsZWZ0QWN0aW9uOiBOYXZBY3Rpb24uZ29CYWNrLm1vZGVsLmNsb25lKGdvQmFja09wdGlvbnMpLFxyXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBvcHRpb25zLmhlbHBJZCA/XHJcbiAgICAgICAgICAgIE5hdkFjdGlvbi5nb0hlbHBJbmRleC5tb2RlbC5jbG9uZSh7XHJcbiAgICAgICAgICAgICAgICBsaW5rOiAnIycgKyBvcHRpb25zLmhlbHBJZFxyXG4gICAgICAgICAgICB9KSA6XHJcbiAgICAgICAgICAgIE5hdkFjdGlvbi5nb0hlbHBJbmRleFxyXG4gICAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIFNpbmdsZXRvbiBoZWxwZXJcclxuKiovXHJcbnZhciBjcmVhdGVTaW5nbGV0b24gPSBmdW5jdGlvbiBjcmVhdGVTaW5nbGV0b24oQWN0aXZpdHlDbGFzcywgJGFjdGl2aXR5LCBhcHApIHtcclxuICAgIFxyXG4gICAgY3JlYXRlU2luZ2xldG9uLmluc3RhbmNlcyA9IGNyZWF0ZVNpbmdsZXRvbi5pbnN0YW5jZXMgfHwge307XHJcbiAgICBcclxuICAgIGlmIChjcmVhdGVTaW5nbGV0b24uaW5zdGFuY2VzW0FjdGl2aXR5Q2xhc3MubmFtZV0gaW5zdGFuY2VvZiBBY3Rpdml0eUNsYXNzKSB7XHJcbiAgICAgICAgcmV0dXJuIGNyZWF0ZVNpbmdsZXRvbi5pbnN0YW5jZXNbQWN0aXZpdHlDbGFzcy5uYW1lXTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHZhciBzID0gbmV3IEFjdGl2aXR5Q2xhc3MoJGFjdGl2aXR5LCBhcHApO1xyXG4gICAgICAgIGNyZWF0ZVNpbmdsZXRvbi5pbnN0YW5jZXNbQWN0aXZpdHlDbGFzcy5uYW1lXSA9IHM7XHJcbiAgICAgICAgcmV0dXJuIHM7XHJcbiAgICB9XHJcbn07XHJcbi8vIEV4YW1wbGUgb2YgdXNlXHJcbi8vZXhwb3J0cy5pbml0ID0gY3JlYXRlU2luZ2xldG9uLmJpbmQobnVsbCwgQWN0aXZpdHlDbGFzcyk7XHJcblxyXG4vKipcclxuICAgIFN0YXRpYyBtZXRob2QgZXh0ZW5kcyB0byBoZWxwIGluaGVyaXRhbmNlLlxyXG4gICAgQWRkaXRpb25hbGx5LCBpdCBhZGRzIGEgc3RhdGljIGluaXQgbWV0aG9kIHJlYWR5IGZvciB0aGUgbmV3IGNsYXNzXHJcbiAgICB0aGF0IGdlbmVyYXRlcy9yZXRyaWV2ZXMgdGhlIHNpbmdsZXRvbi5cclxuKiovXHJcbkFjdGl2aXR5LmV4dGVuZHMgPSBmdW5jdGlvbiBleHRlbmRzQWN0aXZpdHkoQ2xhc3NGbikge1xyXG4gICAgXHJcbiAgICBDbGFzc0ZuLl9pbmhlcml0cyhBY3Rpdml0eSk7XHJcbiAgICBcclxuICAgIENsYXNzRm4uaW5pdCA9IGNyZWF0ZVNpbmdsZXRvbi5iaW5kKG51bGwsIENsYXNzRm4pO1xyXG4gICAgXHJcbiAgICByZXR1cm4gQ2xhc3NGbjtcclxufTtcclxuIiwiLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAqIERhdGVQaWNrZXIgSlMgQ29tcG9uZW50LCB3aXRoIHNldmVyYWxcclxuICogbW9kZXMgYW5kIG9wdGlvbmFsIGlubGluZS1wZXJtYW5lbnQgdmlzdWFsaXphdGlvbi5cclxuICpcclxuICogQ29weXJpZ2h0IDIwMTQgTG9jb25vbWljcyBDb29wLlxyXG4gKlxyXG4gKiBCYXNlZCBvbjpcclxuICogYm9vdHN0cmFwLWRhdGVwaWNrZXIuanMgXHJcbiAqIGh0dHA6Ly93d3cuZXllY29uLnJvL2Jvb3RzdHJhcC1kYXRlcGlja2VyXHJcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gKiBDb3B5cmlnaHQgMjAxMiBTdGVmYW4gUGV0cmVcclxuICpcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcclxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxyXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcclxuICpcclxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXHJcbiAqXHJcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcclxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxyXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cclxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxyXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cclxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpOyBcclxuXHJcbnZhciBjbGFzc2VzID0ge1xyXG4gICAgY29tcG9uZW50OiAnRGF0ZVBpY2tlcicsXHJcbiAgICBtb250aHM6ICdEYXRlUGlja2VyLW1vbnRocycsXHJcbiAgICBkYXlzOiAnRGF0ZVBpY2tlci1kYXlzJyxcclxuICAgIG1vbnRoRGF5OiAnZGF5JyxcclxuICAgIG1vbnRoOiAnbW9udGgnLFxyXG4gICAgeWVhcjogJ3llYXInLFxyXG4gICAgeWVhcnM6ICdEYXRlUGlja2VyLXllYXJzJ1xyXG59O1xyXG5cclxuLy8gUGlja2VyIG9iamVjdFxyXG52YXIgRGF0ZVBpY2tlciA9IGZ1bmN0aW9uKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIC8qanNoaW50IG1heHN0YXRlbWVudHM6MzIsbWF4Y29tcGxleGl0eToyNCovXHJcbiAgICB0aGlzLmVsZW1lbnQgPSAkKGVsZW1lbnQpO1xyXG4gICAgdGhpcy5mb3JtYXQgPSBEUEdsb2JhbC5wYXJzZUZvcm1hdChvcHRpb25zLmZvcm1hdHx8dGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtZm9ybWF0Jyl8fCdtbS9kZC95eXl5Jyk7XHJcbiAgICBcclxuICAgIHRoaXMuaXNJbnB1dCA9IHRoaXMuZWxlbWVudC5pcygnaW5wdXQnKTtcclxuICAgIHRoaXMuY29tcG9uZW50ID0gdGhpcy5lbGVtZW50LmlzKCcuZGF0ZScpID8gdGhpcy5lbGVtZW50LmZpbmQoJy5hZGQtb24nKSA6IGZhbHNlO1xyXG4gICAgdGhpcy5pc1BsYWNlaG9sZGVyID0gdGhpcy5lbGVtZW50LmlzKCcuY2FsZW5kYXItcGxhY2Vob2xkZXInKTtcclxuICAgIFxyXG4gICAgdGhpcy5waWNrZXIgPSAkKERQR2xvYmFsLnRlbXBsYXRlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kVG8odGhpcy5pc1BsYWNlaG9sZGVyID8gdGhpcy5lbGVtZW50IDogJ2JvZHknKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAub24oJ2NsaWNrIHRhcCcsICQucHJveHkodGhpcy5jbGljaywgdGhpcykpO1xyXG4gICAgLy8gVE9ETzogdG8gcmV2aWV3IGlmICdjb250YWluZXInIGNsYXNzIGNhbiBiZSBhdm9pZGVkLCBzbyBpbiBwbGFjZWhvbGRlciBtb2RlIGdldHMgb3B0aW9uYWxcclxuICAgIC8vIGlmIGlzIHdhbnRlZCBjYW4gYmUgcGxhY2VkIG9uIHRoZSBwbGFjZWhvbGRlciBlbGVtZW50IChvciBjb250YWluZXItZmx1aWQgb3Igbm90aGluZylcclxuICAgIHRoaXMucGlja2VyLmFkZENsYXNzKHRoaXMuaXNQbGFjZWhvbGRlciA/ICdjb250YWluZXInIDogJ2Ryb3Bkb3duLW1lbnUnKTtcclxuICAgIFxyXG4gICAgaWYgKHRoaXMuaXNQbGFjZWhvbGRlcikge1xyXG4gICAgICAgIHRoaXMucGlja2VyLnNob3coKTtcclxuICAgICAgICBpZiAodGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUnKSA9PSAndG9kYXknKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcclxuICAgICAgICAgICAgdHlwZTogJ3Nob3cnLFxyXG4gICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGVcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHRoaXMuaXNJbnB1dCkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5vbih7XHJcbiAgICAgICAgICAgIGZvY3VzOiAkLnByb3h5KHRoaXMuc2hvdywgdGhpcyksXHJcbiAgICAgICAgICAgIC8vYmx1cjogJC5wcm94eSh0aGlzLmhpZGUsIHRoaXMpLFxyXG4gICAgICAgICAgICBrZXl1cDogJC5wcm94eSh0aGlzLnVwZGF0ZSwgdGhpcylcclxuICAgICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKHRoaXMuY29tcG9uZW50KXtcclxuICAgICAgICAgICAgdGhpcy5jb21wb25lbnQub24oJ2NsaWNrIHRhcCcsICQucHJveHkodGhpcy5zaG93LCB0aGlzKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lm9uKCdjbGljayB0YXAnLCAkLnByb3h5KHRoaXMuc2hvdywgdGhpcykpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLyogVG91Y2ggZXZlbnRzIHRvIHN3aXBlIGRhdGVzICovXHJcbiAgICB0aGlzLmVsZW1lbnRcclxuICAgIC5vbignc3dpcGVsZWZ0JywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB0aGlzLm1vdmVEYXRlKCduZXh0Jyk7XHJcbiAgICB9LmJpbmQodGhpcykpXHJcbiAgICAub24oJ3N3aXBlcmlnaHQnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHRoaXMubW92ZURhdGUoJ3ByZXYnKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgLyogU2V0LXVwIHZpZXcgbW9kZSAqL1xyXG4gICAgdGhpcy5taW5WaWV3TW9kZSA9IG9wdGlvbnMubWluVmlld01vZGV8fHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLW1pbnZpZXdtb2RlJyl8fDA7XHJcbiAgICBpZiAodHlwZW9mIHRoaXMubWluVmlld01vZGUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgc3dpdGNoICh0aGlzLm1pblZpZXdNb2RlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ21vbnRocyc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pblZpZXdNb2RlID0gMTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICd5ZWFycyc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pblZpZXdNb2RlID0gMjtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5WaWV3TW9kZSA9IDA7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnZpZXdNb2RlID0gb3B0aW9ucy52aWV3TW9kZXx8dGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtdmlld21vZGUnKXx8MDtcclxuICAgIGlmICh0eXBlb2YgdGhpcy52aWV3TW9kZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICBzd2l0Y2ggKHRoaXMudmlld01vZGUpIHtcclxuICAgICAgICAgICAgY2FzZSAnbW9udGhzJzpcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGUgPSAxO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ3llYXJzJzpcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGUgPSAyO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlID0gMDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuc3RhcnRWaWV3TW9kZSA9IHRoaXMudmlld01vZGU7XHJcbiAgICB0aGlzLndlZWtTdGFydCA9IG9wdGlvbnMud2Vla1N0YXJ0fHx0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS13ZWVrc3RhcnQnKXx8MDtcclxuICAgIHRoaXMud2Vla0VuZCA9IHRoaXMud2Vla1N0YXJ0ID09PSAwID8gNiA6IHRoaXMud2Vla1N0YXJ0IC0gMTtcclxuICAgIHRoaXMub25SZW5kZXIgPSBvcHRpb25zLm9uUmVuZGVyO1xyXG4gICAgdGhpcy5maWxsRG93KCk7XHJcbiAgICB0aGlzLmZpbGxNb250aHMoKTtcclxuICAgIHRoaXMudXBkYXRlKCk7XHJcbiAgICB0aGlzLnNob3dNb2RlKCk7XHJcbn07XHJcblxyXG5EYXRlUGlja2VyLnByb3RvdHlwZSA9IHtcclxuICAgIGNvbnN0cnVjdG9yOiBEYXRlUGlja2VyLFxyXG4gICAgXHJcbiAgICBzaG93OiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuc2hvdygpO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5jb21wb25lbnQgPyB0aGlzLmNvbXBvbmVudC5vdXRlckhlaWdodCgpIDogdGhpcy5lbGVtZW50Lm91dGVySGVpZ2h0KCk7XHJcbiAgICAgICAgdGhpcy5wbGFjZSgpO1xyXG4gICAgICAgICQod2luZG93KS5vbigncmVzaXplJywgJC5wcm94eSh0aGlzLnBsYWNlLCB0aGlzKSk7XHJcbiAgICAgICAgaWYgKGUgKSB7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzSW5wdXQpIHtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbihldil7XHJcbiAgICAgICAgICAgIGlmICgkKGV2LnRhcmdldCkuY2xvc2VzdCgnLicgKyBjbGFzc2VzLmNvbXBvbmVudCkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0LmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcclxuICAgICAgICAgICAgdHlwZTogJ3Nob3cnLFxyXG4gICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGVcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIGhpZGU6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuaGlkZSgpO1xyXG4gICAgICAgICQod2luZG93KS5vZmYoJ3Jlc2l6ZScsIHRoaXMucGxhY2UpO1xyXG4gICAgICAgIHRoaXMudmlld01vZGUgPSB0aGlzLnN0YXJ0Vmlld01vZGU7XHJcbiAgICAgICAgdGhpcy5zaG93TW9kZSgpO1xyXG4gICAgICAgIGlmICghdGhpcy5pc0lucHV0KSB7XHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLm9mZignbW91c2Vkb3duJywgdGhpcy5oaWRlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy90aGlzLnNldCgpO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcclxuICAgICAgICAgICAgdHlwZTogJ2hpZGUnLFxyXG4gICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGVcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIHNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGZvcm1hdGVkID0gRFBHbG9iYWwuZm9ybWF0RGF0ZSh0aGlzLmRhdGUsIHRoaXMuZm9ybWF0KTtcclxuICAgICAgICBpZiAoIXRoaXMuaXNJbnB1dCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jb21wb25lbnQpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmZpbmQoJ2lucHV0JykucHJvcCgndmFsdWUnLCBmb3JtYXRlZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUnLCBmb3JtYXRlZCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnByb3AoJ3ZhbHVlJywgZm9ybWF0ZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIFNldHMgYSBkYXRlIGFzIHZhbHVlIGFuZCBub3RpZnkgd2l0aCBhbiBldmVudC5cclxuICAgICAgICBQYXJhbWV0ZXIgZG9udE5vdGlmeSBpcyBvbmx5IGZvciBjYXNlcyB3aGVyZSB0aGUgY2FsZW5kYXIgb3JcclxuICAgICAgICBzb21lIHJlbGF0ZWQgY29tcG9uZW50IGdldHMgYWxyZWFkeSB1cGRhdGVkIGJ1dCB0aGUgaGlnaGxpZ2h0ZWRcclxuICAgICAgICBkYXRlIG5lZWRzIHRvIGJlIHVwZGF0ZWQgd2l0aG91dCBjcmVhdGUgaW5maW5pdGUgcmVjdXJzaW9uIFxyXG4gICAgICAgIGJlY2F1c2Ugb2Ygbm90aWZpY2F0aW9uLiBJbiBvdGhlciBjYXNlLCBkb250IHVzZS5cclxuICAgICoqL1xyXG4gICAgc2V0VmFsdWU6IGZ1bmN0aW9uKG5ld0RhdGUsIGRvbnROb3RpZnkpIHtcclxuICAgICAgICBpZiAodHlwZW9mIG5ld0RhdGUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSA9IERQR2xvYmFsLnBhcnNlRGF0ZShuZXdEYXRlLCB0aGlzLmZvcm1hdCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5kYXRlID0gbmV3IERhdGUobmV3RGF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc2V0KCk7XHJcbiAgICAgICAgdGhpcy52aWV3RGF0ZSA9IG5ldyBEYXRlKHRoaXMuZGF0ZS5nZXRGdWxsWWVhcigpLCB0aGlzLmRhdGUuZ2V0TW9udGgoKSwgMSwgMCwgMCwgMCwgMCk7XHJcbiAgICAgICAgdGhpcy5maWxsKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGRvbnROb3RpZnkgIT09IHRydWUpIHtcclxuICAgICAgICAgICAgLy8gTm90aWZ5OlxyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnY2hhbmdlRGF0ZScsXHJcbiAgICAgICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGUsXHJcbiAgICAgICAgICAgICAgICB2aWV3TW9kZTogRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBnZXRWYWx1ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0ZTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIG1vdmVWYWx1ZTogZnVuY3Rpb24oZGlyLCBtb2RlKSB7XHJcbiAgICAgICAgLy8gZGlyIGNhbiBiZTogJ3ByZXYnLCAnbmV4dCdcclxuICAgICAgICBpZiAoWydwcmV2JywgJ25leHQnXS5pbmRleE9mKGRpciAmJiBkaXIudG9Mb3dlckNhc2UoKSkgPT0gLTEpXHJcbiAgICAgICAgICAgIC8vIE5vIHZhbGlkIG9wdGlvbjpcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBkZWZhdWx0IG1vZGUgaXMgdGhlIGN1cnJlbnQgb25lXHJcbiAgICAgICAgbW9kZSA9IG1vZGUgP1xyXG4gICAgICAgICAgICBEUEdsb2JhbC5tb2Rlc1NldFttb2RlXSA6XHJcbiAgICAgICAgICAgIERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdO1xyXG5cclxuICAgICAgICB0aGlzLmRhdGVbJ3NldCcgKyBtb2RlLm5hdkZuY10uY2FsbChcclxuICAgICAgICAgICAgdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICB0aGlzLmRhdGVbJ2dldCcgKyBtb2RlLm5hdkZuY10uY2FsbCh0aGlzLmRhdGUpICsgXHJcbiAgICAgICAgICAgIG1vZGUubmF2U3RlcCAqIChkaXIgPT09ICdwcmV2JyA/IC0xIDogMSlcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMuc2V0VmFsdWUodGhpcy5kYXRlKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5kYXRlO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgcGxhY2U6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdmFyIG9mZnNldCA9IHRoaXMuY29tcG9uZW50ID8gdGhpcy5jb21wb25lbnQub2Zmc2V0KCkgOiB0aGlzLmVsZW1lbnQub2Zmc2V0KCk7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuY3NzKHtcclxuICAgICAgICAgICAgdG9wOiBvZmZzZXQudG9wICsgdGhpcy5oZWlnaHQsXHJcbiAgICAgICAgICAgIGxlZnQ6IG9mZnNldC5sZWZ0XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uKG5ld0RhdGUpe1xyXG4gICAgICAgIHRoaXMuZGF0ZSA9IERQR2xvYmFsLnBhcnNlRGF0ZShcclxuICAgICAgICAgICAgdHlwZW9mIG5ld0RhdGUgPT09ICdzdHJpbmcnID8gbmV3RGF0ZSA6ICh0aGlzLmlzSW5wdXQgPyB0aGlzLmVsZW1lbnQucHJvcCgndmFsdWUnKSA6IHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlJykpLFxyXG4gICAgICAgICAgICB0aGlzLmZvcm1hdFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgdGhpcy52aWV3RGF0ZSA9IG5ldyBEYXRlKHRoaXMuZGF0ZS5nZXRGdWxsWWVhcigpLCB0aGlzLmRhdGUuZ2V0TW9udGgoKSwgMSwgMCwgMCwgMCwgMCk7XHJcbiAgICAgICAgdGhpcy5maWxsKCk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBmaWxsRG93OiBmdW5jdGlvbigpe1xyXG4gICAgICAgIHZhciBkb3dDbnQgPSB0aGlzLndlZWtTdGFydDtcclxuICAgICAgICB2YXIgaHRtbCA9ICc8dHI+JztcclxuICAgICAgICB3aGlsZSAoZG93Q250IDwgdGhpcy53ZWVrU3RhcnQgKyA3KSB7XHJcbiAgICAgICAgICAgIGh0bWwgKz0gJzx0aCBjbGFzcz1cImRvd1wiPicrRFBHbG9iYWwuZGF0ZXMuZGF5c01pblsoZG93Q250KyspJTddKyc8L3RoPic7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGh0bWwgKz0gJzwvdHI+JztcclxuICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcuJyArIGNsYXNzZXMuZGF5cyArICcgdGhlYWQnKS5hcHBlbmQoaHRtbCk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBmaWxsTW9udGhzOiBmdW5jdGlvbigpe1xyXG4gICAgICAgIHZhciBodG1sID0gJyc7XHJcbiAgICAgICAgdmFyIGkgPSAwO1xyXG4gICAgICAgIHdoaWxlIChpIDwgMTIpIHtcclxuICAgICAgICAgICAgaHRtbCArPSAnPHNwYW4gY2xhc3M9XCInICsgY2xhc3Nlcy5tb250aCArICdcIj4nK0RQR2xvYmFsLmRhdGVzLm1vbnRoc1Nob3J0W2krK10rJzwvc3Bhbj4nO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcuJyArIGNsYXNzZXMubW9udGhzICsgJyB0ZCcpLmFwcGVuZChodG1sKTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIGZpbGw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8qanNoaW50IG1heHN0YXRlbWVudHM6NjYsIG1heGNvbXBsZXhpdHk6MjgqL1xyXG4gICAgICAgIHZhciBkID0gbmV3IERhdGUodGhpcy52aWV3RGF0ZSksXHJcbiAgICAgICAgICAgIHllYXIgPSBkLmdldEZ1bGxZZWFyKCksXHJcbiAgICAgICAgICAgIG1vbnRoID0gZC5nZXRNb250aCgpLFxyXG4gICAgICAgICAgICBjdXJyZW50RGF0ZSA9IHRoaXMuZGF0ZS52YWx1ZU9mKCk7XHJcbiAgICAgICAgdGhpcy5waWNrZXJcclxuICAgICAgICAuZmluZCgnLicgKyBjbGFzc2VzLmRheXMgKyAnIHRoOmVxKDEpJylcclxuICAgICAgICAuaHRtbChEUEdsb2JhbC5kYXRlcy5tb250aHNbbW9udGhdICsgJyAnICsgeWVhcik7XHJcbiAgICAgICAgdmFyIHByZXZNb250aCA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLTEsIDI4LDAsMCwwLDApLFxyXG4gICAgICAgICAgICBkYXkgPSBEUEdsb2JhbC5nZXREYXlzSW5Nb250aChwcmV2TW9udGguZ2V0RnVsbFllYXIoKSwgcHJldk1vbnRoLmdldE1vbnRoKCkpO1xyXG4gICAgICAgIHByZXZNb250aC5zZXREYXRlKGRheSk7XHJcbiAgICAgICAgcHJldk1vbnRoLnNldERhdGUoZGF5IC0gKHByZXZNb250aC5nZXREYXkoKSAtIHRoaXMud2Vla1N0YXJ0ICsgNyklNyk7XHJcbiAgICAgICAgdmFyIG5leHRNb250aCA9IG5ldyBEYXRlKHByZXZNb250aCk7XHJcbiAgICAgICAgbmV4dE1vbnRoLnNldERhdGUobmV4dE1vbnRoLmdldERhdGUoKSArIDQyKTtcclxuICAgICAgICBuZXh0TW9udGggPSBuZXh0TW9udGgudmFsdWVPZigpO1xyXG4gICAgICAgIHZhciBodG1sID0gW107XHJcbiAgICAgICAgdmFyIGNsc05hbWUsXHJcbiAgICAgICAgICAgIHByZXZZLFxyXG4gICAgICAgICAgICBwcmV2TTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgaWYgKHRoaXMuX2RheXNDcmVhdGVkICE9PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBodG1sIChmaXJzdCB0aW1lIG9ubHkpXHJcbiAgICAgICBcclxuICAgICAgICAgICAgd2hpbGUocHJldk1vbnRoLnZhbHVlT2YoKSA8IG5leHRNb250aCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZNb250aC5nZXREYXkoKSA9PT0gdGhpcy53ZWVrU3RhcnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goJzx0cj4nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNsc05hbWUgPSB0aGlzLm9uUmVuZGVyKHByZXZNb250aCk7XHJcbiAgICAgICAgICAgICAgICBwcmV2WSA9IHByZXZNb250aC5nZXRGdWxsWWVhcigpO1xyXG4gICAgICAgICAgICAgICAgcHJldk0gPSBwcmV2TW9udGguZ2V0TW9udGgoKTtcclxuICAgICAgICAgICAgICAgIGlmICgocHJldk0gPCBtb250aCAmJiAgcHJldlkgPT09IHllYXIpIHx8ICBwcmV2WSA8IHllYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgb2xkJztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoKHByZXZNID4gbW9udGggJiYgcHJldlkgPT09IHllYXIpIHx8IHByZXZZID4geWVhcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBuZXcnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZNb250aC52YWx1ZU9mKCkgPT09IGN1cnJlbnREYXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIGFjdGl2ZSc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2goJzx0ZCBjbGFzcz1cIicgKyBjbGFzc2VzLm1vbnRoRGF5ICsgJyAnICsgY2xzTmFtZSsnXCI+JytwcmV2TW9udGguZ2V0RGF0ZSgpICsgJzwvdGQ+Jyk7XHJcbiAgICAgICAgICAgICAgICBpZiAocHJldk1vbnRoLmdldERheSgpID09PSB0aGlzLndlZWtFbmQpIHtcclxuICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goJzwvdHI+Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBwcmV2TW9udGguc2V0RGF0ZShwcmV2TW9udGguZ2V0RGF0ZSgpKzEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcuJyArIGNsYXNzZXMuZGF5cyArICcgdGJvZHknKS5lbXB0eSgpLmFwcGVuZChodG1sLmpvaW4oJycpKTtcclxuICAgICAgICAgICAgdGhpcy5fZGF5c0NyZWF0ZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gVXBkYXRlIGRheXMgdmFsdWVzXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgd2Vla1RyID0gdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLmRheXMgKyAnIHRib2R5IHRyOmZpcnN0LWNoaWxkKCknKTtcclxuICAgICAgICAgICAgdmFyIGRheVRkID0gbnVsbDtcclxuICAgICAgICAgICAgd2hpbGUocHJldk1vbnRoLnZhbHVlT2YoKSA8IG5leHRNb250aCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRXZWVrRGF5SW5kZXggPSBwcmV2TW9udGguZ2V0RGF5KCkgLSB0aGlzLndlZWtTdGFydDtcclxuXHJcbiAgICAgICAgICAgICAgICBjbHNOYW1lID0gdGhpcy5vblJlbmRlcihwcmV2TW9udGgpO1xyXG4gICAgICAgICAgICAgICAgcHJldlkgPSBwcmV2TW9udGguZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICAgICAgICAgIHByZXZNID0gcHJldk1vbnRoLmdldE1vbnRoKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoKHByZXZNIDwgbW9udGggJiYgIHByZXZZID09PSB5ZWFyKSB8fCAgcHJldlkgPCB5ZWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIG9sZCc7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKChwcmV2TSA+IG1vbnRoICYmIHByZXZZID09PSB5ZWFyKSB8fCBwcmV2WSA+IHllYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgbmV3JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGgudmFsdWVPZigpID09PSBjdXJyZW50RGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBhY3RpdmUnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy9odG1sLnB1c2goJzx0ZCBjbGFzcz1cImRheSAnK2Nsc05hbWUrJ1wiPicrcHJldk1vbnRoLmdldERhdGUoKSArICc8L3RkPicpO1xyXG4gICAgICAgICAgICAgICAgZGF5VGQgPSB3ZWVrVHIuZmluZCgndGQ6ZXEoJyArIGN1cnJlbnRXZWVrRGF5SW5kZXggKyAnKScpO1xyXG4gICAgICAgICAgICAgICAgZGF5VGRcclxuICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdkYXkgJyArIGNsc05hbWUpXHJcbiAgICAgICAgICAgICAgICAudGV4dChwcmV2TW9udGguZ2V0RGF0ZSgpKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gTmV4dCB3ZWVrP1xyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZNb250aC5nZXREYXkoKSA9PT0gdGhpcy53ZWVrRW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2Vla1RyID0gd2Vla1RyLm5leHQoJ3RyJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBwcmV2TW9udGguc2V0RGF0ZShwcmV2TW9udGguZ2V0RGF0ZSgpKzEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY3VycmVudFllYXIgPSB0aGlzLmRhdGUuZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgbW9udGhzID0gdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLm1vbnRocylcclxuICAgICAgICAgICAgICAgICAgICAuZmluZCgndGg6ZXEoMSknKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuaHRtbCh5ZWFyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZW5kKClcclxuICAgICAgICAgICAgICAgICAgICAuZmluZCgnc3BhbicpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcclxuICAgICAgICBpZiAoY3VycmVudFllYXIgPT09IHllYXIpIHtcclxuICAgICAgICAgICAgbW9udGhzLmVxKHRoaXMuZGF0ZS5nZXRNb250aCgpKS5hZGRDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGh0bWwgPSAnJztcclxuICAgICAgICB5ZWFyID0gcGFyc2VJbnQoeWVhci8xMCwgMTApICogMTA7XHJcbiAgICAgICAgdmFyIHllYXJDb250ID0gdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLnllYXJzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ3RoOmVxKDEpJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGV4dCh5ZWFyICsgJy0nICsgKHllYXIgKyA5KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZW5kKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKCd0ZCcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHllYXIgLT0gMTtcclxuICAgICAgICB2YXIgaTtcclxuICAgICAgICBpZiAodGhpcy5feWVhcnNDcmVhdGVkICE9PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGkgPSAtMTsgaSA8IDExOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGh0bWwgKz0gJzxzcGFuIGNsYXNzPVwiJyArIGNsYXNzZXMueWVhciArIChpID09PSAtMSB8fCBpID09PSAxMCA/ICcgb2xkJyA6ICcnKSsoY3VycmVudFllYXIgPT09IHllYXIgPyAnIGFjdGl2ZScgOiAnJykrJ1wiPicreWVhcisnPC9zcGFuPic7XHJcbiAgICAgICAgICAgICAgICB5ZWFyICs9IDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHllYXJDb250Lmh0bWwoaHRtbCk7XHJcbiAgICAgICAgICAgIHRoaXMuX3llYXJzQ3JlYXRlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHllYXJTcGFuID0geWVhckNvbnQuZmluZCgnc3BhbjpmaXJzdC1jaGlsZCgpJyk7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IC0xOyBpIDwgMTE7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgLy9odG1sICs9ICc8c3BhbiBjbGFzcz1cInllYXInKyhpID09PSAtMSB8fCBpID09PSAxMCA/ICcgb2xkJyA6ICcnKSsoY3VycmVudFllYXIgPT09IHllYXIgPyAnIGFjdGl2ZScgOiAnJykrJ1wiPicreWVhcisnPC9zcGFuPic7XHJcbiAgICAgICAgICAgICAgICB5ZWFyU3BhblxyXG4gICAgICAgICAgICAgICAgLnRleHQoeWVhcilcclxuICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICd5ZWFyJyArIChpID09PSAtMSB8fCBpID09PSAxMCA/ICcgb2xkJyA6ICcnKSArIChjdXJyZW50WWVhciA9PT0geWVhciA/ICcgYWN0aXZlJyA6ICcnKSk7XHJcbiAgICAgICAgICAgICAgICB5ZWFyICs9IDE7XHJcbiAgICAgICAgICAgICAgICB5ZWFyU3BhbiA9IHllYXJTcGFuLm5leHQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIG1vdmVEYXRlOiBmdW5jdGlvbihkaXIsIG1vZGUpIHtcclxuICAgICAgICAvLyBkaXIgY2FuIGJlOiAncHJldicsICduZXh0J1xyXG4gICAgICAgIGlmIChbJ3ByZXYnLCAnbmV4dCddLmluZGV4T2YoZGlyICYmIGRpci50b0xvd2VyQ2FzZSgpKSA9PSAtMSlcclxuICAgICAgICAgICAgLy8gTm8gdmFsaWQgb3B0aW9uOlxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIC8vIGRlZmF1bHQgbW9kZSBpcyB0aGUgY3VycmVudCBvbmVcclxuICAgICAgICBtb2RlID0gbW9kZSB8fCB0aGlzLnZpZXdNb2RlO1xyXG5cclxuICAgICAgICB0aGlzLnZpZXdEYXRlWydzZXQnK0RQR2xvYmFsLm1vZGVzW21vZGVdLm5hdkZuY10uY2FsbChcclxuICAgICAgICAgICAgdGhpcy52aWV3RGF0ZSxcclxuICAgICAgICAgICAgdGhpcy52aWV3RGF0ZVsnZ2V0JytEUEdsb2JhbC5tb2Rlc1ttb2RlXS5uYXZGbmNdLmNhbGwodGhpcy52aWV3RGF0ZSkgKyBcclxuICAgICAgICAgICAgRFBHbG9iYWwubW9kZXNbbW9kZV0ubmF2U3RlcCAqIChkaXIgPT09ICdwcmV2JyA/IC0xIDogMSlcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgICAgIHRoaXMuc2V0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsaWNrOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgLypqc2hpbnQgbWF4Y29tcGxleGl0eToxNiovXHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdmFyIHRhcmdldCA9ICQoZS50YXJnZXQpLmNsb3Nlc3QoJ3NwYW4sIHRkLCB0aCcpO1xyXG4gICAgICAgIGlmICh0YXJnZXQubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgIHZhciBtb250aCwgeWVhcjtcclxuICAgICAgICAgICAgc3dpdGNoKHRhcmdldFswXS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd0aCc6XHJcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoKHRhcmdldFswXS5jbGFzc05hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3dpdGNoJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd01vZGUoMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAncHJldic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ25leHQnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3ZlRGF0ZSh0YXJnZXRbMF0uY2xhc3NOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3NwYW4nOlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuaXMoJy4nICsgY2xhc3Nlcy5tb250aCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggPSB0YXJnZXQucGFyZW50KCkuZmluZCgnc3BhbicpLmluZGV4KHRhcmdldCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmlld0RhdGUuc2V0TW9udGgobW9udGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHllYXIgPSBwYXJzZUludCh0YXJnZXQudGV4dCgpLCAxMCl8fDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmlld0RhdGUuc2V0RnVsbFllYXIoeWVhcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnZpZXdNb2RlICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0ZSA9IG5ldyBEYXRlKHRoaXMudmlld0RhdGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2hhbmdlRGF0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3TW9kZTogRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93TW9kZSgtMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQoKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3RkJzpcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmlzKCcuZGF5JykgJiYgIXRhcmdldC5pcygnLmRpc2FibGVkJykpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGF5ID0gcGFyc2VJbnQodGFyZ2V0LnRleHQoKSwgMTApfHwxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb250aCA9IHRoaXMudmlld0RhdGUuZ2V0TW9udGgoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldC5pcygnLm9sZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb250aCAtPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRhcmdldC5pcygnLm5ldycpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb250aCArPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHllYXIgPSB0aGlzLnZpZXdEYXRlLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0ZSA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLCBkYXksMCwwLDAsMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmlld0RhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgTWF0aC5taW4oMjgsIGRheSksMCwwLDAsMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2hhbmdlRGF0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3TW9kZTogRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBtb3VzZWRvd246IGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgc2hvd01vZGU6IGZ1bmN0aW9uKGRpcikge1xyXG4gICAgICAgIGlmIChkaXIpIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3TW9kZSA9IE1hdGgubWF4KHRoaXMubWluVmlld01vZGUsIE1hdGgubWluKDIsIHRoaXMudmlld01vZGUgKyBkaXIpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnPmRpdicpLmhpZGUoKS5maWx0ZXIoJy4nICsgY2xhc3Nlcy5jb21wb25lbnQgKyAnLScgKyBEUEdsb2JhbC5tb2Rlc1t0aGlzLnZpZXdNb2RlXS5jbHNOYW1lKS5zaG93KCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4kLmZuLmRhdGVwaWNrZXIgPSBmdW5jdGlvbiAoIG9wdGlvbiApIHtcclxuICAgIHZhciB2YWxzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcclxuICAgIHZhciByZXR1cm5lZDtcclxuICAgIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgZGF0YSA9ICR0aGlzLmRhdGEoJ2RhdGVwaWNrZXInKSxcclxuICAgICAgICAgICAgb3B0aW9ucyA9IHR5cGVvZiBvcHRpb24gPT09ICdvYmplY3QnICYmIG9wdGlvbjtcclxuICAgICAgICBpZiAoIWRhdGEpIHtcclxuICAgICAgICAgICAgJHRoaXMuZGF0YSgnZGF0ZXBpY2tlcicsIChkYXRhID0gbmV3IERhdGVQaWNrZXIodGhpcywgJC5leHRlbmQoe30sICQuZm4uZGF0ZXBpY2tlci5kZWZhdWx0cyxvcHRpb25zKSkpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICByZXR1cm5lZCA9IGRhdGFbb3B0aW9uXS5hcHBseShkYXRhLCB2YWxzKTtcclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgYSB2YWx1ZSByZXR1cm5lZCBieSB0aGUgbWV0aG9kP1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mKHJldHVybmVkICE9PSAndW5kZWZpbmVkJykpIHtcclxuICAgICAgICAgICAgICAgIC8vIEdvIG91dCB0aGUgbG9vcCB0byByZXR1cm4gdGhlIHZhbHVlIGZyb20gdGhlIGZpcnN0XHJcbiAgICAgICAgICAgICAgICAvLyBlbGVtZW50LW1ldGhvZCBleGVjdXRpb25cclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBGb2xsb3cgbmV4dCBsb29wIGl0ZW1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIGlmICh0eXBlb2YocmV0dXJuZWQpICE9PSAndW5kZWZpbmVkJylcclxuICAgICAgICByZXR1cm4gcmV0dXJuZWQ7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgLy8gY2hhaW5pbmc6XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4kLmZuLmRhdGVwaWNrZXIuZGVmYXVsdHMgPSB7XHJcbiAgICBvblJlbmRlcjogZnVuY3Rpb24oLypkYXRlKi8pIHtcclxuICAgICAgICByZXR1cm4gJyc7XHJcbiAgICB9XHJcbn07XHJcbiQuZm4uZGF0ZXBpY2tlci5Db25zdHJ1Y3RvciA9IERhdGVQaWNrZXI7XHJcblxyXG52YXIgRFBHbG9iYWwgPSB7XHJcbiAgICBtb2RlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xzTmFtZTogJ2RheXMnLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdNb250aCcsXHJcbiAgICAgICAgICAgIG5hdlN0ZXA6IDFcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xzTmFtZTogJ21vbnRocycsXHJcbiAgICAgICAgICAgIG5hdkZuYzogJ0Z1bGxZZWFyJyxcclxuICAgICAgICAgICAgbmF2U3RlcDogMVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjbHNOYW1lOiAneWVhcnMnLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdGdWxsWWVhcicsXHJcbiAgICAgICAgICAgIG5hdlN0ZXA6IDEwXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNsc05hbWU6ICdkYXknLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdEYXRlJyxcclxuICAgICAgICAgICAgbmF2U3RlcDogMVxyXG4gICAgICAgIH1cclxuICAgIF0sXHJcbiAgICBkYXRlczp7XHJcbiAgICAgICAgZGF5czogW1wiU3VuZGF5XCIsIFwiTW9uZGF5XCIsIFwiVHVlc2RheVwiLCBcIldlZG5lc2RheVwiLCBcIlRodXJzZGF5XCIsIFwiRnJpZGF5XCIsIFwiU2F0dXJkYXlcIiwgXCJTdW5kYXlcIl0sXHJcbiAgICAgICAgZGF5c1Nob3J0OiBbXCJTdW5cIiwgXCJNb25cIiwgXCJUdWVcIiwgXCJXZWRcIiwgXCJUaHVcIiwgXCJGcmlcIiwgXCJTYXRcIiwgXCJTdW5cIl0sXHJcbiAgICAgICAgZGF5c01pbjogW1wiU3VcIiwgXCJNb1wiLCBcIlR1XCIsIFwiV2VcIiwgXCJUaFwiLCBcIkZyXCIsIFwiU2FcIiwgXCJTdVwiXSxcclxuICAgICAgICBtb250aHM6IFtcIkphbnVhcnlcIiwgXCJGZWJydWFyeVwiLCBcIk1hcmNoXCIsIFwiQXByaWxcIiwgXCJNYXlcIiwgXCJKdW5lXCIsIFwiSnVseVwiLCBcIkF1Z3VzdFwiLCBcIlNlcHRlbWJlclwiLCBcIk9jdG9iZXJcIiwgXCJOb3ZlbWJlclwiLCBcIkRlY2VtYmVyXCJdLFxyXG4gICAgICAgIG1vbnRoc1Nob3J0OiBbXCJKYW5cIiwgXCJGZWJcIiwgXCJNYXJcIiwgXCJBcHJcIiwgXCJNYXlcIiwgXCJKdW5cIiwgXCJKdWxcIiwgXCJBdWdcIiwgXCJTZXBcIiwgXCJPY3RcIiwgXCJOb3ZcIiwgXCJEZWNcIl1cclxuICAgIH0sXHJcbiAgICBpc0xlYXBZZWFyOiBmdW5jdGlvbiAoeWVhcikge1xyXG4gICAgICAgIHJldHVybiAoKCh5ZWFyICUgNCA9PT0gMCkgJiYgKHllYXIgJSAxMDAgIT09IDApKSB8fCAoeWVhciAlIDQwMCA9PT0gMCkpO1xyXG4gICAgfSxcclxuICAgIGdldERheXNJbk1vbnRoOiBmdW5jdGlvbiAoeWVhciwgbW9udGgpIHtcclxuICAgICAgICByZXR1cm4gWzMxLCAoRFBHbG9iYWwuaXNMZWFwWWVhcih5ZWFyKSA/IDI5IDogMjgpLCAzMSwgMzAsIDMxLCAzMCwgMzEsIDMxLCAzMCwgMzEsIDMwLCAzMV1bbW9udGhdO1xyXG4gICAgfSxcclxuICAgIHBhcnNlRm9ybWF0OiBmdW5jdGlvbihmb3JtYXQpe1xyXG4gICAgICAgIHZhciBzZXBhcmF0b3IgPSBmb3JtYXQubWF0Y2goL1suXFwvXFwtXFxzXS4qPy8pLFxyXG4gICAgICAgICAgICBwYXJ0cyA9IGZvcm1hdC5zcGxpdCgvXFxXKy8pO1xyXG4gICAgICAgIGlmICghc2VwYXJhdG9yIHx8ICFwYXJ0cyB8fCBwYXJ0cy5sZW5ndGggPT09IDApe1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGRhdGUgZm9ybWF0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHtzZXBhcmF0b3I6IHNlcGFyYXRvciwgcGFydHM6IHBhcnRzfTtcclxuICAgIH0sXHJcbiAgICBwYXJzZURhdGU6IGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCkge1xyXG4gICAgICAgIC8qanNoaW50IG1heGNvbXBsZXhpdHk6MTEqL1xyXG4gICAgICAgIHZhciBwYXJ0cyA9IGRhdGUuc3BsaXQoZm9ybWF0LnNlcGFyYXRvciksXHJcbiAgICAgICAgICAgIHZhbDtcclxuICAgICAgICBkYXRlID0gbmV3IERhdGUoKTtcclxuICAgICAgICBkYXRlLnNldEhvdXJzKDApO1xyXG4gICAgICAgIGRhdGUuc2V0TWludXRlcygwKTtcclxuICAgICAgICBkYXRlLnNldFNlY29uZHMoMCk7XHJcbiAgICAgICAgZGF0ZS5zZXRNaWxsaXNlY29uZHMoMCk7XHJcbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gZm9ybWF0LnBhcnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgeWVhciA9IGRhdGUuZ2V0RnVsbFllYXIoKSwgZGF5ID0gZGF0ZS5nZXREYXRlKCksIG1vbnRoID0gZGF0ZS5nZXRNb250aCgpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpPTAsIGNudCA9IGZvcm1hdC5wYXJ0cy5sZW5ndGg7IGkgPCBjbnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFsID0gcGFyc2VJbnQocGFydHNbaV0sIDEwKXx8MTtcclxuICAgICAgICAgICAgICAgIHN3aXRjaChmb3JtYXQucGFydHNbaV0pIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdkZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRheSA9IHZhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZS5zZXREYXRlKHZhbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ21tJzpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdtJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggPSB2YWwgLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlLnNldE1vbnRoKHZhbCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd5eSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHllYXIgPSAyMDAwICsgdmFsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlLnNldEZ1bGxZZWFyKDIwMDAgKyB2YWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd5eXl5JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgeWVhciA9IHZhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZS5zZXRGdWxsWWVhcih2YWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGgsIGRheSwgMCAsMCAsMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRlO1xyXG4gICAgfSxcclxuICAgIGZvcm1hdERhdGU6IGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCl7XHJcbiAgICAgICAgdmFyIHZhbCA9IHtcclxuICAgICAgICAgICAgZDogZGF0ZS5nZXREYXRlKCksXHJcbiAgICAgICAgICAgIG06IGRhdGUuZ2V0TW9udGgoKSArIDEsXHJcbiAgICAgICAgICAgIHl5OiBkYXRlLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKS5zdWJzdHJpbmcoMiksXHJcbiAgICAgICAgICAgIHl5eXk6IGRhdGUuZ2V0RnVsbFllYXIoKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFsLmRkID0gKHZhbC5kIDwgMTAgPyAnMCcgOiAnJykgKyB2YWwuZDtcclxuICAgICAgICB2YWwubW0gPSAodmFsLm0gPCAxMCA/ICcwJyA6ICcnKSArIHZhbC5tO1xyXG4gICAgICAgIGRhdGUgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpPTAsIGNudCA9IGZvcm1hdC5wYXJ0cy5sZW5ndGg7IGkgPCBjbnQ7IGkrKykge1xyXG4gICAgICAgICAgICBkYXRlLnB1c2godmFsW2Zvcm1hdC5wYXJ0c1tpXV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0ZS5qb2luKGZvcm1hdC5zZXBhcmF0b3IpO1xyXG4gICAgfSxcclxuICAgIGhlYWRUZW1wbGF0ZTogJzx0aGVhZD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHRyPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRoIGNsYXNzPVwicHJldlwiPiZsc2FxdW87PC90aD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0aCBjb2xzcGFuPVwiNVwiIGNsYXNzPVwic3dpdGNoXCI+PC90aD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0aCBjbGFzcz1cIm5leHRcIj4mcnNhcXVvOzwvdGg+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvdHI+JytcclxuICAgICAgICAgICAgICAgICAgICAnPC90aGVhZD4nLFxyXG4gICAgY29udFRlbXBsYXRlOiAnPHRib2R5Pjx0cj48dGQgY29sc3Bhbj1cIjdcIj48L3RkPjwvdHI+PC90Ym9keT4nXHJcbn07XHJcbkRQR2xvYmFsLnRlbXBsYXRlID0gJzxkaXYgY2xhc3M9XCInICsgY2xhc3Nlcy5jb21wb25lbnQgKyAnXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCInICsgY2xhc3Nlcy5kYXlzICsgJ1wiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRhYmxlIGNsYXNzPVwiIHRhYmxlLWNvbmRlbnNlZFwiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRFBHbG9iYWwuaGVhZFRlbXBsYXRlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGJvZHk+PC90Ym9keT4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvdGFibGU+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiJyArIGNsYXNzZXMubW9udGhzICsgJ1wiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRhYmxlIGNsYXNzPVwidGFibGUtY29uZGVuc2VkXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEUEdsb2JhbC5oZWFkVGVtcGxhdGUrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRFBHbG9iYWwuY29udFRlbXBsYXRlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvdGFibGU+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiJyArIGNsYXNzZXMueWVhcnMgKyAnXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGFibGUgY2xhc3M9XCJ0YWJsZS1jb25kZW5zZWRcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERQR2xvYmFsLmhlYWRUZW1wbGF0ZStcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEUEdsb2JhbC5jb250VGVtcGxhdGUrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC90YWJsZT4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JytcclxuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JztcclxuRFBHbG9iYWwubW9kZXNTZXQgPSB7XHJcbiAgICAnZGF0ZSc6IERQR2xvYmFsLm1vZGVzWzNdLFxyXG4gICAgJ21vbnRoJzogRFBHbG9iYWwubW9kZXNbMF0sXHJcbiAgICAneWVhcic6IERQR2xvYmFsLm1vZGVzWzFdLFxyXG4gICAgJ2RlY2FkZSc6IERQR2xvYmFsLm1vZGVzWzJdXHJcbn07XHJcblxyXG4vKiogUHVibGljIEFQSSAqKi9cclxuZXhwb3J0cy5EYXRlUGlja2VyID0gRGF0ZVBpY2tlcjtcclxuZXhwb3J0cy5kZWZhdWx0cyA9IERQR2xvYmFsO1xyXG5leHBvcnRzLnV0aWxzID0gRFBHbG9iYWw7XHJcbiIsIi8qKlxyXG4gICAgU21hcnROYXZCYXIgY29tcG9uZW50LlxyXG4gICAgUmVxdWlyZXMgaXRzIENTUyBjb3VudGVycGFydC5cclxuICAgIFxyXG4gICAgQ3JlYXRlZCBiYXNlZCBvbiB0aGUgcHJvamVjdDpcclxuICAgIFxyXG4gICAgUHJvamVjdC1UeXNvblxyXG4gICAgV2Vic2l0ZTogaHR0cHM6Ly9naXRodWIuY29tL2MycHJvZHMvUHJvamVjdC1UeXNvblxyXG4gICAgQXV0aG9yOiBjMnByb2RzXHJcbiAgICBMaWNlbnNlOlxyXG4gICAgVGhlIE1JVCBMaWNlbnNlIChNSVQpXHJcbiAgICBDb3B5cmlnaHQgKGMpIDIwMTMgYzJwcm9kc1xyXG4gICAgUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZlxyXG4gICAgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpblxyXG4gICAgdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0b1xyXG4gICAgdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2ZcclxuICAgIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbyxcclxuICAgIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxyXG4gICAgVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXHJcbiAgICBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxyXG4gICAgVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxyXG4gICAgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1NcclxuICAgIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUlxyXG4gICAgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSXHJcbiAgICBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTlxyXG4gICAgQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG4vKipcclxuICAgIEludGVybmFsIHV0aWxpdHkuXHJcbiAgICBSZW1vdmVzIGFsbCBjaGlsZHJlbiBmb3IgYSBET00gbm9kZVxyXG4qKi9cclxudmFyIGNsZWFyTm9kZSA9IGZ1bmN0aW9uIChub2RlKSB7XHJcbiAgICB3aGlsZShub2RlLmZpcnN0Q2hpbGQpe1xyXG4gICAgICAgIG5vZGUucmVtb3ZlQ2hpbGQobm9kZS5maXJzdENoaWxkKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gICAgQ2FsY3VsYXRlcyBhbmQgYXBwbGllcyB0aGUgYmVzdCBzaXppbmcgYW5kIGRpc3RyaWJ1dGlvbiBmb3IgdGhlIHRpdGxlXHJcbiAgICBkZXBlbmRpbmcgb24gY29udGVudCBhbmQgYnV0dG9ucy5cclxuICAgIFBhc3MgaW4gdGhlIHRpdGxlIGVsZW1lbnQsIGJ1dHRvbnMgbXVzdCBiZSBmb3VuZCBhcyBzaWJsaW5ncyBvZiBpdC5cclxuKiovXHJcbnZhciB0ZXh0Ym94UmVzaXplID0gZnVuY3Rpb24gdGV4dGJveFJlc2l6ZShlbCkge1xyXG4gICAgLyoganNoaW50IG1heHN0YXRlbWVudHM6IDI4LCBtYXhjb21wbGV4aXR5OjExICovXHJcbiAgICBcclxuICAgIHZhciBsZWZ0YnRuID0gZWwucGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yQWxsKCcuU21hcnROYXZCYXItZWRnZS5sZWZ0JylbMF07XHJcbiAgICB2YXIgcmlnaHRidG4gPSBlbC5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoJy5TbWFydE5hdkJhci1lZGdlLnJpZ2h0JylbMF07XHJcbiAgICBpZiAodHlwZW9mIGxlZnRidG4gPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgbGVmdGJ0biA9IHtcclxuICAgICAgICAgICAgb2Zmc2V0V2lkdGg6IDAsXHJcbiAgICAgICAgICAgIGNsYXNzTmFtZTogJydcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiByaWdodGJ0biA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICByaWdodGJ0biA9IHtcclxuICAgICAgICAgICAgb2Zmc2V0V2lkdGg6IDAsXHJcbiAgICAgICAgICAgIGNsYXNzTmFtZTogJydcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB2YXIgbWFyZ2luID0gTWF0aC5tYXgobGVmdGJ0bi5vZmZzZXRXaWR0aCwgcmlnaHRidG4ub2Zmc2V0V2lkdGgpO1xyXG4gICAgZWwuc3R5bGUubWFyZ2luTGVmdCA9IG1hcmdpbiArICdweCc7XHJcbiAgICBlbC5zdHlsZS5tYXJnaW5SaWdodCA9IG1hcmdpbiArICdweCc7XHJcbiAgICB2YXIgdG9vTG9uZyA9IChlbC5vZmZzZXRXaWR0aCA8IGVsLnNjcm9sbFdpZHRoKSA/IHRydWUgOiBmYWxzZTtcclxuICAgIGlmICh0b29Mb25nKSB7XHJcbiAgICAgICAgaWYgKGxlZnRidG4ub2Zmc2V0V2lkdGggPCByaWdodGJ0bi5vZmZzZXRXaWR0aCkge1xyXG4gICAgICAgICAgICBlbC5zdHlsZS5tYXJnaW5MZWZ0ID0gbGVmdGJ0bi5vZmZzZXRXaWR0aCArICdweCc7XHJcbiAgICAgICAgICAgIGVsLnN0eWxlLnRleHRBbGlnbiA9ICdyaWdodCc7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZWwuc3R5bGUubWFyZ2luUmlnaHQgPSByaWdodGJ0bi5vZmZzZXRXaWR0aCArICdweCc7XHJcbiAgICAgICAgICAgIGVsLnN0eWxlLnRleHRBbGlnbiA9ICdsZWZ0JztcclxuICAgICAgICB9XHJcbiAgICAgICAgdG9vTG9uZyA9IChlbC5vZmZzZXRXaWR0aDxlbC5zY3JvbGxXaWR0aCkgPyB0cnVlIDogZmFsc2U7XHJcbiAgICAgICAgaWYgKHRvb0xvbmcpIHtcclxuICAgICAgICAgICAgaWYgKG5ldyBSZWdFeHAoJ2Fycm93JykudGVzdChsZWZ0YnRuLmNsYXNzTmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIGNsZWFyTm9kZShsZWZ0YnRuLmNoaWxkTm9kZXNbMV0pO1xyXG4gICAgICAgICAgICAgICAgZWwuc3R5bGUubWFyZ2luTGVmdCA9ICcyNnB4JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAobmV3IFJlZ0V4cCgnYXJyb3cnKS50ZXN0KHJpZ2h0YnRuLmNsYXNzTmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIGNsZWFyTm9kZShyaWdodGJ0bi5jaGlsZE5vZGVzWzFdKTtcclxuICAgICAgICAgICAgICAgIGVsLnN0eWxlLm1hcmdpblJpZ2h0ID0gJzI2cHgnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0cy50ZXh0Ym94UmVzaXplID0gdGV4dGJveFJlc2l6ZTtcclxuXHJcbi8qKlxyXG4gICAgU21hcnROYXZCYXIgY2xhc3MsIGluc3RhbnRpYXRlIHdpdGggYSBET00gZWxlbWVudFxyXG4gICAgcmVwcmVzZW50aW5nIGEgbmF2YmFyLlxyXG4gICAgQVBJOlxyXG4gICAgLSByZWZyZXNoOiB1cGRhdGVzIHRoZSBjb250cm9sIHRha2luZyBjYXJlIG9mIHRoZSBuZWVkZWRcclxuICAgICAgICB3aWR0aCBmb3IgdGl0bGUgYW5kIGJ1dHRvbnNcclxuKiovXHJcbnZhciBTbWFydE5hdkJhciA9IGZ1bmN0aW9uIFNtYXJ0TmF2QmFyKGVsKSB7XHJcbiAgICB0aGlzLmVsID0gZWw7XHJcbiAgICBcclxuICAgIHRoaXMucmVmcmVzaCA9IGZ1bmN0aW9uIHJlZnJlc2goKSB7XHJcbiAgICAgICAgdmFyIGggPSAkKGVsKS5jaGlsZHJlbignaDEnKS5nZXQoMCk7XHJcbiAgICAgICAgaWYgKGgpXHJcbiAgICAgICAgICAgIHRleHRib3hSZXNpemUoaCk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMucmVmcmVzaCgpOyBcclxufTtcclxuXHJcbmV4cG9ydHMuU21hcnROYXZCYXIgPSBTbWFydE5hdkJhcjtcclxuXHJcbi8qKlxyXG4gICAgR2V0IGluc3RhbmNlcyBmb3IgYWxsIHRoZSBTbWFydE5hdkJhciBlbGVtZW50cyBpbiB0aGUgRE9NXHJcbioqL1xyXG5leHBvcnRzLmdldEFsbCA9IGZ1bmN0aW9uIGdldEFsbCgpIHtcclxuICAgIHZhciBhbGwgPSAkKCcuU21hcnROYXZCYXInKTtcclxuICAgIHJldHVybiAkLm1hcChhbGwsIGZ1bmN0aW9uKGl0ZW0pIHsgcmV0dXJuIG5ldyBTbWFydE5hdkJhcihpdGVtKTsgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIFJlZnJlc2ggYWxsIFNtYXJ0TmF2QmFyIGZvdW5kIGluIHRoZSBkb2N1bWVudC5cclxuKiovXHJcbmV4cG9ydHMucmVmcmVzaEFsbCA9IGZ1bmN0aW9uIHJlZnJlc2hBbGwoKSB7XHJcbiAgICAkKCcuU21hcnROYXZCYXIgPiBoMScpLmVhY2goZnVuY3Rpb24oKSB7IHRleHRib3hSZXNpemUodGhpcyk7IH0pO1xyXG59O1xyXG4iLCIvKipcclxuICAgIEN1c3RvbSBMb2Nvbm9taWNzICdsb2NhbGUnIHN0eWxlcyBmb3IgZGF0ZS90aW1lcy5cclxuICAgIEl0cyBhIGJpdCBtb3JlICdjb29sJyByZW5kZXJpbmcgZGF0ZXMgOy0pXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbi8vIFNpbmNlIHRoZSB0YXNrIG9mIGRlZmluZSBhIGxvY2FsZSBjaGFuZ2VzXHJcbi8vIHRoZSBjdXJyZW50IGdsb2JhbCBsb2NhbGUsIHdlIHNhdmUgYSByZWZlcmVuY2VcclxuLy8gYW5kIHJlc3RvcmUgaXQgbGF0ZXIgc28gbm90aGluZyBjaGFuZ2VkLlxyXG52YXIgY3VycmVudCA9IG1vbWVudC5sb2NhbGUoKTtcclxuXHJcbm1vbWVudC5sb2NhbGUoJ2VuLVVTLUxDJywge1xyXG4gICAgbWVyaWRpZW1QYXJzZSA6IC9bYXBdXFwuP1xcLj8vaSxcclxuICAgIG1lcmlkaWVtIDogZnVuY3Rpb24gKGhvdXJzLCBtaW51dGVzLCBpc0xvd2VyKSB7XHJcbiAgICAgICAgaWYgKGhvdXJzID4gMTEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGlzTG93ZXIgPyAncCcgOiAnUCc7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIGlzTG93ZXIgPyAnYScgOiAnQSc7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGNhbGVuZGFyIDoge1xyXG4gICAgICAgIGxhc3REYXkgOiAnW1llc3RlcmRheV0nLFxyXG4gICAgICAgIHNhbWVEYXkgOiAnW1RvZGF5XScsXHJcbiAgICAgICAgbmV4dERheSA6ICdbVG9tb3Jyb3ddJyxcclxuICAgICAgICBsYXN0V2VlayA6ICdbbGFzdF0gZGRkZCcsXHJcbiAgICAgICAgbmV4dFdlZWsgOiAnZGRkZCcsXHJcbiAgICAgICAgc2FtZUVsc2UgOiAnTS9EJ1xyXG4gICAgfSxcclxuICAgIGxvbmdEYXRlRm9ybWF0IDoge1xyXG4gICAgICAgIExUOiAnaDptbWEnLFxyXG4gICAgICAgIExUUzogJ2g6bW06c3NhJyxcclxuICAgICAgICBMOiAnTU0vREQvWVlZWScsXHJcbiAgICAgICAgbDogJ00vRC9ZWVlZJyxcclxuICAgICAgICBMTDogJ01NTU0gRG8gWVlZWScsXHJcbiAgICAgICAgbGw6ICdNTU0gRCBZWVlZJyxcclxuICAgICAgICBMTEw6ICdNTU1NIERvIFlZWVkgTFQnLFxyXG4gICAgICAgIGxsbDogJ01NTSBEIFlZWVkgTFQnLFxyXG4gICAgICAgIExMTEw6ICdkZGRkLCBNTU1NIERvIFlZWVkgTFQnLFxyXG4gICAgICAgIGxsbGw6ICdkZGQsIE1NTSBEIFlZWVkgTFQnXHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLy8gUmVzdG9yZSBsb2NhbGVcclxubW9tZW50LmxvY2FsZShjdXJyZW50KTtcclxuIiwiLyoqIEFkZHJlc3MgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIEFkZHJlc3ModmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgYWRkcmVzc0lEOiAwLFxyXG4gICAgICAgIGFkZHJlc3NOYW1lOiAnJyxcclxuICAgICAgICBqb2JUaXRsZUlEOiAwLFxyXG4gICAgICAgIHVzZXJJRDogMCxcclxuICAgICAgICBhZGRyZXNzTGluZTE6IG51bGwsXHJcbiAgICAgICAgYWRkcmVzc0xpbmUyOiBudWxsLFxyXG4gICAgICAgIHBvc3RhbENvZGU6IG51bGwsXHJcbiAgICAgICAgY2l0eTogbnVsbCwgLy8gQXV0b2ZpbGxlZCBieSBzZXJ2ZXJcclxuICAgICAgICBzdGF0ZVByb3ZpbmNlQ29kZTogbnVsbCwgLy8gQXV0b2ZpbGxlZCBieSBzZXJ2ZXJcclxuICAgICAgICBzdGF0ZVByb3ZpY2VOYW1lOiBudWxsLCAvLyBBdXRvZmlsbGVkIGJ5IHNlcnZlclxyXG4gICAgICAgIGNvdW50cnlDb2RlOiBudWxsLCAvLyBJU08gQWxwaGEtMiBjb2RlLCBFeC46ICdVUydcclxuICAgICAgICBsYXRpdHVkZTogbnVsbCxcclxuICAgICAgICBsb25naXR1ZGU6IG51bGwsXHJcbiAgICAgICAgc3BlY2lhbEluc3RydWN0aW9uczogbnVsbCxcclxuICAgICAgICBpc1NlcnZpY2VBcmVhOiBmYWxzZSxcclxuICAgICAgICBpc1NlcnZpY2VMb2NhdGlvbjogZmFsc2UsXHJcbiAgICAgICAgc2VydmljZVJhZGl1czogMCxcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCwgLy8gQXV0b2ZpbGxlZCBieSBzZXJ2ZXJcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbCwgLy8gQXV0b2ZpbGxlZCBieSBzZXJ2ZXJcclxuICAgICAgICBraW5kOiAnJyAvLyBBdXRvZmlsbGVkIGJ5IHNlcnZlclxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5zaW5nbGVMaW5lID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGxpc3QgPSBbXHJcbiAgICAgICAgICAgIHRoaXMuYWRkcmVzc0xpbmUxKCksXHJcbiAgICAgICAgICAgIHRoaXMuY2l0eSgpLFxyXG4gICAgICAgICAgICB0aGlzLnBvc3RhbENvZGUoKSxcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZVByb3ZpbmNlQ29kZSgpXHJcbiAgICAgICAgXTtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbGlzdC5maWx0ZXIoZnVuY3Rpb24odikgeyByZXR1cm4gISF2OyB9KS5qb2luKCcsICcpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIC8vIFRPRE86IG5lZWRlZD8gbDEwbj8gbXVzdCBiZSBwcm92aWRlZCBieSBzZXJ2ZXIgc2lkZT9cclxuICAgIHZhciBjb3VudHJpZXMgPSB7XHJcbiAgICAgICAgJ1VTJzogJ1VuaXRlZCBTdGF0ZXMnLFxyXG4gICAgICAgICdFUyc6ICdTcGFpbidcclxuICAgIH07XHJcbiAgICB0aGlzLmNvdW50cnlOYW1lID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIGNvdW50cmllc1t0aGlzLmNvdW50cnlDb2RlKCldIHx8ICd1bmtub3cnO1xyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgLy8gVXNlZnVsIEdQUyBvYmplY3Qgd2l0aCB0aGUgZm9ybWF0IHVzZWQgYnkgR29vZ2xlIE1hcHNcclxuICAgIHRoaXMubGF0bG5nID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgbGF0OiB0aGlzLmxhdGl0dWRlKCksXHJcbiAgICAgICAgICAgIGxuZzogdGhpcy5sb25naXR1ZGUoKVxyXG4gICAgICAgIH07XHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBZGRyZXNzO1xyXG4iLCIvKiogQXBwb2ludG1lbnQgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIENsaWVudCA9IHJlcXVpcmUoJy4vQ2xpZW50JyksXHJcbiAgICBMb2NhdGlvbiA9IHJlcXVpcmUoJy4vTG9jYXRpb24nKSxcclxuICAgIFNlcnZpY2UgPSByZXF1aXJlKCcuL1NlcnZpY2UnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG4gICBcclxuZnVuY3Rpb24gQXBwb2ludG1lbnQodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgLy8gQW4gYXBwb2ludG1lbnQgZXZlciByZWZlcmVuY2VzIGFuIGV2ZW50LCBhbmQgaXRzICdpZCcgaXMgYSBDYWxlbmRhckV2ZW50SURcclxuICAgICAgICAvLyBldmVuIGlmIG90aGVyIGNvbXBsZW1lbnRhcnkgb2JqZWN0IGFyZSB1c2VkIGFzICdzb3VyY2UnXHJcbiAgICAgICAgaWQ6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3RhcnRUaW1lOiBudWxsLFxyXG4gICAgICAgIGVuZFRpbWU6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gRXZlbnQgc3VtbWFyeTpcclxuICAgICAgICBzdW1tYXJ5OiAnTmV3IGJvb2tpbmcnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YnRvdGFsUHJpY2U6IDAsXHJcbiAgICAgICAgZmVlUHJpY2U6IDAsXHJcbiAgICAgICAgcGZlZVByaWNlOiAwLFxyXG4gICAgICAgIHRvdGFsUHJpY2U6IDAsXHJcbiAgICAgICAgcHRvdGFsUHJpY2U6IDAsXHJcbiAgICAgICAgXHJcbiAgICAgICAgcHJlTm90ZXNUb0NsaWVudDogbnVsbCxcclxuICAgICAgICBwb3N0Tm90ZXNUb0NsaWVudDogbnVsbCxcclxuICAgICAgICBwcmVOb3Rlc1RvU2VsZjogbnVsbCxcclxuICAgICAgICBwb3N0Tm90ZXNUb1NlbGY6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgc291cmNlRXZlbnQ6IG51bGwsXHJcbiAgICAgICAgc291cmNlQm9va2luZzogbnVsbFxyXG4gICAgICAgIC8vc291cmNlQm9va2luZ1JlcXVlc3QsIG1heWJlIGZ1dHVyZT9cclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHZhbHVlcyA9IHZhbHVlcyB8fCB7fTtcclxuXHJcbiAgICB0aGlzLmNsaWVudCA9IGtvLm9ic2VydmFibGUodmFsdWVzLmNsaWVudCA/IG5ldyBDbGllbnQodmFsdWVzLmNsaWVudCkgOiBudWxsKTtcclxuXHJcbiAgICB0aGlzLmxvY2F0aW9uID0ga28ub2JzZXJ2YWJsZShuZXcgTG9jYXRpb24odmFsdWVzLmxvY2F0aW9uKSk7XHJcbiAgICB0aGlzLmxvY2F0aW9uU3VtbWFyeSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxvY2F0aW9uKCkuc2luZ2xlTGluZSgpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2VydmljZXMgPSBrby5vYnNlcnZhYmxlQXJyYXkoKHZhbHVlcy5zZXJ2aWNlcyB8fCBbXSkubWFwKGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICByZXR1cm4gKHNlcnZpY2UgaW5zdGFuY2VvZiBTZXJ2aWNlKSA/IHNlcnZpY2UgOiBuZXcgU2VydmljZShzZXJ2aWNlKTtcclxuICAgIH0pKTtcclxuICAgIHRoaXMuc2VydmljZXNTdW1tYXJ5ID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VydmljZXMoKS5tYXAoZnVuY3Rpb24oc2VydmljZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc2VydmljZS5uYW1lKCk7XHJcbiAgICAgICAgfSkuam9pbignLCAnKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICAvLyBQcmljZSB1cGRhdGUgb24gc2VydmljZXMgY2hhbmdlc1xyXG4gICAgLy8gVE9ETyBJcyBub3QgY29tcGxldGUgZm9yIHByb2R1Y3Rpb25cclxuICAgIHRoaXMuc2VydmljZXMuc3Vic2NyaWJlKGZ1bmN0aW9uKHNlcnZpY2VzKSB7XHJcbiAgICAgICAgdGhpcy5wdG90YWxQcmljZShzZXJ2aWNlcy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwcmV2ICsgY3VyLnByaWNlKCk7XHJcbiAgICAgICAgfSwgMCkpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIFxyXG4gICAgLy8gU21hcnQgdmlzdWFsaXphdGlvbiBvZiBkYXRlIGFuZCB0aW1lXHJcbiAgICB0aGlzLmRpc3BsYXllZERhdGUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzLnN0YXJ0VGltZSgpKS5sb2NhbGUoJ2VuLVVTLUxDJykuY2FsZW5kYXIoKTtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmRpc3BsYXllZFN0YXJ0VGltZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbW9tZW50KHRoaXMuc3RhcnRUaW1lKCkpLmxvY2FsZSgnZW4tVVMtTEMnKS5mb3JtYXQoJ0xUJyk7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNwbGF5ZWRFbmRUaW1lID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBtb21lbnQodGhpcy5lbmRUaW1lKCkpLmxvY2FsZSgnZW4tVVMtTEMnKS5mb3JtYXQoJ0xUJyk7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNwbGF5ZWRUaW1lUmFuZ2UgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlzcGxheWVkU3RhcnRUaW1lKCkgKyAnLScgKyB0aGlzLmRpc3BsYXllZEVuZFRpbWUoKTtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLml0U3RhcnRlZCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKHRoaXMuc3RhcnRUaW1lKCkgJiYgbmV3IERhdGUoKSA+PSB0aGlzLnN0YXJ0VGltZSgpKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLml0RW5kZWQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLmVuZFRpbWUoKSAmJiBuZXcgRGF0ZSgpID49IHRoaXMuZW5kVGltZSgpKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmlzTmV3ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAoIXRoaXMuaWQoKSk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5zdGF0ZUhlYWRlciA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgdGV4dCA9ICcnO1xyXG4gICAgICAgIGlmICghdGhpcy5pc05ldygpKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLml0U3RhcnRlZCgpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pdEVuZGVkKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gJ0NvbXBsZXRlZDonO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dCA9ICdOb3c6JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRleHQgPSAnVXBjb21pbmc6JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRleHQ7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBcHBvaW50bWVudDtcclxuXHJcbi8qKlxyXG4gICAgQ3JlYXRlcyBhbiBhcHBvaW50bWVudCBpbnN0YW5jZSBmcm9tIGEgQ2FsZW5kYXJFdmVudCBtb2RlbCBpbnN0YW5jZVxyXG4qKi9cclxuQXBwb2ludG1lbnQuZnJvbUNhbGVuZGFyRXZlbnQgPSBmdW5jdGlvbiBmcm9tQ2FsZW5kYXJFdmVudChldmVudCkge1xyXG4gICAgdmFyIGFwdCA9IG5ldyBBcHBvaW50bWVudCgpO1xyXG4gICAgXHJcbiAgICAvLyBJbmNsdWRlIGV2ZW50IGluIGFwdFxyXG4gICAgYXB0LmlkKGV2ZW50LmNhbGVuZGFyRXZlbnRJRCgpKTtcclxuICAgIGFwdC5zdGFydFRpbWUoZXZlbnQuc3RhcnRUaW1lKCkpO1xyXG4gICAgYXB0LmVuZFRpbWUoZXZlbnQuZW5kVGltZSgpKTtcclxuICAgIGFwdC5zdW1tYXJ5KGV2ZW50LnN1bW1hcnkoKSk7XHJcbiAgICBhcHQuc291cmNlRXZlbnQoZXZlbnQpO1xyXG4gICAgXHJcbiAgICByZXR1cm4gYXB0O1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBDcmVhdGVzIGFuIGFwcG9pbnRtZW50IGluc3RhbmNlIGZyb20gYSBCb29raW5nIGFuZCBhIENhbGVuZGFyRXZlbnQgbW9kZWwgaW5zdGFuY2VzXHJcbioqL1xyXG5BcHBvaW50bWVudC5mcm9tQm9va2luZyA9IGZ1bmN0aW9uIGZyb21Cb29raW5nKGJvb2tpbmcsIGV2ZW50KSB7XHJcbiAgICAvLyBJbmNsdWRlIGV2ZW50IGluIGFwdFxyXG4gICAgdmFyIGFwdCA9IEFwcG9pbnRtZW50LmZyb21DYWxlbmRhckV2ZW50KGV2ZW50KTtcclxuICAgIFxyXG4gICAgLy8gSW5jbHVkZSBib29raW5nIGluIGFwdFxyXG4gICAgLy8gVE9ETyBOZWVkcyByZXZpZXcsIG1heWJlIGFmdGVyIHJlZG9uZSBhcHBvaW50bWVudDpcclxuICAgIHZhciBwcmljZXMgPSBib29raW5nLmJvb2tpbmdSZXF1ZXN0KCkgJiYgYm9va2luZy5ib29raW5nUmVxdWVzdCgpLnByaWNpbmdFc3RpbWF0ZSgpO1xyXG4gICAgaWYgKHByaWNlcykge1xyXG4gICAgICAgIGFwdC5zdWJ0b3RhbFByaWNlKHByaWNlcy5zdWJ0b3RhbFByaWNlKCkpO1xyXG4gICAgICAgIGFwdC5mZWVQcmljZShwcmljZXMuZmVlUHJpY2UoKSk7XHJcbiAgICAgICAgYXB0LnBmZWVQcmljZShwcmljZXMucEZlZVByaWNlKCkpO1xyXG4gICAgICAgIGFwdC50b3RhbFByaWNlKHByaWNlcy50b3RhbFByaWNlKCkpO1xyXG4gICAgICAgIGFwdC5wdG90YWxQcmljZShwcmljZXMudG90YWxQcmljZSgpIC0gcHJpY2VzLnBGZWVQcmljZSgpKTtcclxuICAgIH1cclxuICAgIGFwdC5zb3VyY2VCb29raW5nKGJvb2tpbmcpO1xyXG4gICAgXHJcbiAgICByZXR1cm4gYXB0O1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBDcmVhdGVzIGEgbGlzdCBvZiBhcHBvaW50bWVudCBpbnN0YW5jZXMgZnJvbSB0aGUgbGlzdCBvZiBldmVudHMgYW5kIGJvb2tpbmdzLlxyXG4gICAgVGhlIGJvb2tpbmdzIGxpc3QgbXVzdCBjb250YWluIGV2ZXJ5IGJvb2tpbmcgdGhhdCBiZWxvbmdzIHRvIHRoZSBldmVudHMgb2YgdHlwZVxyXG4gICAgJ2Jvb2tpbmcnIGZyb20gdGhlIGxpc3Qgb2YgZXZlbnRzLlxyXG4qKi9cclxuQXBwb2ludG1lbnQubGlzdEZyb21DYWxlbmRhckV2ZW50c0Jvb2tpbmdzID0gZnVuY3Rpb24gbGlzdEZyb21DYWxlbmRhckV2ZW50c0Jvb2tpbmdzKGV2ZW50cywgYm9va2luZ3MpIHtcclxuICAgIHJldHVybiBldmVudHMubWFwKGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgdmFyIGJvb2tpbmcgPSBudWxsO1xyXG4gICAgICAgIGJvb2tpbmdzLnNvbWUoZnVuY3Rpb24oc2VhcmNoQm9va2luZykge1xyXG4gICAgICAgICAgICB2YXIgZm91bmQgPSBzZWFyY2hCb29raW5nLmNvbmZpcm1lZERhdGVJRCgpID09PSBldmVudC5jYWxlbmRhckV2ZW50SUQoKTtcclxuICAgICAgICAgICAgaWYgKGZvdW5kKSB7XHJcbiAgICAgICAgICAgICAgICBib29raW5nID0gc2VhcmNoQm9va2luZztcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmIChib29raW5nKVxyXG4gICAgICAgICAgICByZXR1cm4gQXBwb2ludG1lbnQuZnJvbUJvb2tpbmcoYm9va2luZywgZXZlbnQpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgcmV0dXJuIEFwcG9pbnRtZW50LmZyb21DYWxlbmRhckV2ZW50KGV2ZW50KTtcclxuICAgIH0pO1xyXG59O1xyXG5cclxudmFyIFRpbWUgPSByZXF1aXJlKCcuLi91dGlscy9UaW1lJyk7XHJcbi8qKlxyXG4gICAgQ3JlYXRlcyBhbiBBcHBvaW50bWVudCBpbnN0YW5jZSB0aGF0IHJlcHJlc2VudHMgYSBjYWxlbmRhciBzbG90IG9mXHJcbiAgICBmcmVlL3NwYXJlIHRpbWUsIGZvciB0aGUgZ2l2ZW4gdGltZSByYW5nZSwgb3IgdGhlIGZ1bGwgZ2l2ZW4gZGF0ZS5cclxuICAgIEBwYXJhbSBvcHRpb25zOk9iamVjdCB7XHJcbiAgICAgICAgZGF0ZTpEYXRlLiBPcHRpb25hbC4gVXNlZCB0byBjcmVhdGUgYSBmdWxsIGRhdGUgc2xvdCBvciBkZWZhdWx0IGZvciBzdGFydC9lbmRcclxuICAgICAgICAgICAgdG8gZGF0ZSBzdGFydCBvciBkYXRlIGVuZFxyXG4gICAgICAgIHN0YXJ0OkRhdGUuIE9wdGlvbmFsLiBCZWdnaW5pbmcgb2YgdGhlIHNsb3RcclxuICAgICAgICBlbmQ6RGF0ZS4gT3B0aW9uYWwuIEVuZGluZyBvZiB0aGUgc2xvdFxyXG4gICAgICAgIHRleHQ6c3RyaW5nLiBPcHRpb25hbCBbJ0ZyZWUnXS4gVG8gYWxsb3cgZXh0ZXJuYWwgbG9jYWxpemF0aW9uIG9mIHRoZSB0ZXh0LlxyXG4gICAgfVxyXG4qKi9cclxuQXBwb2ludG1lbnQubmV3RnJlZVNsb3QgPSBmdW5jdGlvbiBuZXdGcmVlU2xvdChvcHRpb25zKSB7XHJcbiAgICBcclxuICAgIHZhciBzdGFydCA9IG9wdGlvbnMuc3RhcnQgfHwgbmV3IFRpbWUob3B0aW9ucy5kYXRlLCAwLCAwLCAwKSxcclxuICAgICAgICBlbmQgPSBvcHRpb25zLmVuZCB8fCBuZXcgVGltZShvcHRpb25zLmRhdGUsIDAsIDAsIDApO1xyXG5cclxuICAgIHJldHVybiBuZXcgQXBwb2ludG1lbnQoe1xyXG4gICAgICAgIGlkOiAtMixcclxuXHJcbiAgICAgICAgc3RhcnRUaW1lOiBzdGFydCxcclxuICAgICAgICBlbmRUaW1lOiBlbmQsXHJcblxyXG4gICAgICAgIHN1bW1hcnk6IG9wdGlvbnMudGV4dCB8fCAnRnJlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGxcclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKiogQm9va2luZyBtb2RlbC5cclxuXHJcbiAgICBEZXNjcmliZXMgYSBib29raW5nIHdpdGggcmVsYXRlZCBCb29raW5nUmVxdWVzdCBcclxuICAgIGFuZCBQcmljaW5nRXN0aW1hdGUgb2JqZWN0cy5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBCb29raW5nKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGJvb2tpbmdJRDogMCxcclxuICAgICAgICBib29raW5nUmVxdWVzdElEOiAwLFxyXG4gICAgICAgIGNvbmZpcm1lZERhdGVJRDogbnVsbCxcclxuICAgICAgICB0b3RhbFByaWNlUGFpZEJ5Q3VzdG9tZXI6IG51bGwsXHJcbiAgICAgICAgdG90YWxTZXJ2aWNlRmVlc1BhaWRCeUN1c3RvbWVyOiBudWxsLFxyXG4gICAgICAgIHRvdGFsUGFpZFRvRnJlZWxhbmNlcjogbnVsbCxcclxuICAgICAgICB0b3RhbFNlcnZpY2VGZWVzUGFpZEJ5RnJlZWxhbmNlcjogbnVsbCxcclxuICAgICAgICBib29raW5nU3RhdHVzSUQ6IG51bGwsXHJcbiAgICAgICAgcHJpY2luZ0FkanVzdG1lbnRBcHBsaWVkOiBmYWxzZSxcclxuICAgICAgICBcclxuICAgICAgICByZXZpZXdlZEJ5RnJlZWxhbmNlcjogZmFsc2UsXHJcbiAgICAgICAgcmV2aWV3ZWRCeUN1c3RvbWVyOiBmYWxzZSxcclxuICAgICAgICBcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBib29raW5nUmVxdWVzdDogbnVsbCAvLyBCb29raW5nUmVxdWVzdFxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5ib29raW5nUmVxdWVzdChuZXcgQm9va2luZ1JlcXVlc3QodmFsdWVzICYmIHZhbHVlcy5ib29raW5nUmVxdWVzdCB8fCB7fSkpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJvb2tpbmc7XHJcblxyXG5mdW5jdGlvbiBCb29raW5nUmVxdWVzdCh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBib29raW5nUmVxdWVzdElEOiAwLFxyXG4gICAgICAgIGJvb2tpbmdUeXBlSUQ6IDAsXHJcbiAgICAgICAgY3VzdG9tZXJVc2VySUQ6IDAsXHJcbiAgICAgICAgZnJlZWxhbmNlclVzZXJJRDogMCxcclxuICAgICAgICBqb2JUaXRsZUlEOiAwLFxyXG4gICAgICAgIHByaWNpbmdFc3RpbWF0ZUlEOiAwLFxyXG4gICAgICAgIGJvb2tpbmdSZXF1ZXN0U3RhdHVzSUQ6IDAsXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3BlY2lhbFJlcXVlc3RzOiBudWxsLFxyXG4gICAgICAgIHByZWZlcnJlZERhdGVJRDogbnVsbCxcclxuICAgICAgICBhbHRlcm5hdGl2ZURhdGUxSUQ6IG51bGwsXHJcbiAgICAgICAgYWx0ZXJuYXRpdmVEYXRlMklEOiBudWxsLFxyXG4gICAgICAgIGFkZHJlc3NJRDogbnVsbCxcclxuICAgICAgICBjYW5jZWxsYXRpb25Qb2xpY3lJRDogbnVsbCxcclxuICAgICAgICBpbnN0YW50Qm9va2luZzogZmFsc2UsXHJcbiAgICAgICAgXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgcHJpY2luZ0VzdGltYXRlOiBudWxsIC8vIFByaWNpbmdFc3RpbWF0ZVxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5wcmljaW5nRXN0aW1hdGUobmV3IFByaWNpbmdFc3RpbWF0ZSh2YWx1ZXMgJiYgdmFsdWVzLnByaWNpbmdFc3RpbWF0ZSB8fCB7fSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBQcmljaW5nRXN0aW1hdGUodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgcHJpY2luZ0VzdGltYXRlSUQ6IDAsXHJcbiAgICAgICAgcHJpY2luZ0VzdGltYXRlUmV2aXNpb246IDAsXHJcbiAgICAgICAgc2VydmljZUR1cmF0aW9uSG91cnM6IG51bGwsXHJcbiAgICAgICAgZmlyc3RTZXNzaW9uRHVyYXRpb25Ib3VyczogbnVsbCxcclxuICAgICAgICBzdWJ0b3RhbFByaWNlOiBudWxsLFxyXG4gICAgICAgIGZlZVByaWNlOiBudWxsLFxyXG4gICAgICAgIHRvdGFsUHJpY2U6IG51bGwsXHJcbiAgICAgICAgcEZlZVByaWNlOiBudWxsLFxyXG4gICAgICAgIHN1YnRvdGFsUmVmdW5kZWQ6IG51bGwsXHJcbiAgICAgICAgZmVlUmVmdW5kZWQ6IG51bGwsXHJcbiAgICAgICAgdG90YWxSZWZ1bmRlZDogbnVsbCxcclxuICAgICAgICBkYXRlUmVmdW5kZWQ6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgZGV0YWlsczogW11cclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIGlmICh2YWx1ZXMgJiYgQXJyYXkuaXNBcnJheSh2YWx1ZXMuZGV0YWlscykpIHtcclxuICAgICAgICB0aGlzLmRldGFpbHModmFsdWVzLmRldGFpbHMubWFwKGZ1bmN0aW9uKGRldGFpbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFByaWNpbmdFc3RpbWF0ZURldGFpbChkZXRhaWwpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gUHJpY2luZ0VzdGltYXRlRGV0YWlsKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGZyZWVsYW5jZXJQcmljaW5nSUQ6IDAsXHJcbiAgICAgICAgZnJlZWxhbmNlclByaWNpbmdEYXRhSW5wdXQ6IG51bGwsXHJcbiAgICAgICAgY3VzdG9tZXJQcmljaW5nRGF0YUlucHV0OiBudWxsLFxyXG4gICAgICAgIGhvdXJseVByaWNlOiBudWxsLFxyXG4gICAgICAgIHN1YnRvdGFsUHJpY2U6IG51bGwsXHJcbiAgICAgICAgZmVlUHJpY2U6IG51bGwsXHJcbiAgICAgICAgdG90YWxQcmljZTogbnVsbCxcclxuICAgICAgICBzZXJ2aWNlRHVyYXRpb25Ib3VyczogbnVsbCxcclxuICAgICAgICBmaXJzdFNlc3Npb25EdXJhdGlvbkhvdXJzOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBudWxsLFxyXG4gICAgICAgIHVwZGF0ZWREYXRlOiBudWxsXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcbiIsIi8qKiBCb29raW5nU3VtbWFyeSBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbiAgICBcclxuZnVuY3Rpb24gQm9va2luZ1N1bW1hcnkodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgcXVhbnRpdHk6IDAsXHJcbiAgICAgICAgY29uY2VwdDogJycsXHJcbiAgICAgICAgdGltZTogbnVsbCxcclxuICAgICAgICB0aW1lRm9ybWF0OiAnIFtAXSBoOm1tYSdcclxuICAgIH0sIHZhbHVlcyk7XHJcblxyXG4gICAgdGhpcy5waHJhc2UgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgdCA9IHRoaXMudGltZUZvcm1hdCgpICYmIFxyXG4gICAgICAgICAgICB0aGlzLnRpbWUoKSAmJiBcclxuICAgICAgICAgICAgbW9tZW50KHRoaXMudGltZSgpKS5mb3JtYXQodGhpcy50aW1lRm9ybWF0KCkpIHx8XHJcbiAgICAgICAgICAgICcnOyAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uY2VwdCgpICsgdDtcclxuICAgIH0sIHRoaXMpO1xyXG5cclxuICAgIHRoaXMudXJsID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciB1cmwgPSB0aGlzLnRpbWUoKSAmJlxyXG4gICAgICAgICAgICAnL2NhbGVuZGFyLycgKyB0aGlzLnRpbWUoKS50b0lTT1N0cmluZygpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB1cmw7XHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCb29raW5nU3VtbWFyeTtcclxuIiwiLyoqXHJcbiAgICBFdmVudCBtb2RlbFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyogRXhhbXBsZSBKU09OIChyZXR1cm5lZCBieSB0aGUgUkVTVCBBUEkpOlxyXG57XHJcbiAgXCJFdmVudElEXCI6IDM1MyxcclxuICBcIlVzZXJJRFwiOiAxNDEsXHJcbiAgXCJFdmVudFR5cGVJRFwiOiAzLFxyXG4gIFwiU3VtbWFyeVwiOiBcIkhvdXNla2VlcGVyIHNlcnZpY2VzIGZvciBKb2huIEQuXCIsXHJcbiAgXCJBdmFpbGFiaWxpdHlUeXBlSURcIjogMyxcclxuICBcIlN0YXJ0VGltZVwiOiBcIjIwMTQtMDMtMjVUMDg6MDA6MDBaXCIsXHJcbiAgXCJFbmRUaW1lXCI6IFwiMjAxNC0wMy0yNVQxODowMDowMFpcIixcclxuICBcIktpbmRcIjogMCxcclxuICBcIklzQWxsRGF5XCI6IGZhbHNlLFxyXG4gIFwiVGltZVpvbmVcIjogXCIwMTowMDowMFwiLFxyXG4gIFwiTG9jYXRpb25cIjogXCJudWxsXCIsXHJcbiAgXCJVcGRhdGVkRGF0ZVwiOiBcIjIwMTQtMTAtMzBUMTU6NDQ6NDkuNjUzXCIsXHJcbiAgXCJDcmVhdGVkRGF0ZVwiOiBudWxsLFxyXG4gIFwiRGVzY3JpcHRpb25cIjogXCJ0ZXN0IGRlc2NyaXB0aW9uIG9mIGEgUkVTVCBldmVudFwiLFxyXG4gIFwiUmVjdXJyZW5jZVJ1bGVcIjoge1xyXG4gICAgXCJGcmVxdWVuY3lUeXBlSURcIjogNTAyLFxyXG4gICAgXCJJbnRlcnZhbFwiOiAxLFxyXG4gICAgXCJVbnRpbFwiOiBcIjIwMTQtMDctMDFUMDA6MDA6MDBcIixcclxuICAgIFwiQ291bnRcIjogbnVsbCxcclxuICAgIFwiRW5kaW5nXCI6IFwiZGF0ZVwiLFxyXG4gICAgXCJTZWxlY3RlZFdlZWtEYXlzXCI6IFtcclxuICAgICAgMSxcclxuICAgIF0sXHJcbiAgICBcIk1vbnRobHlXZWVrRGF5XCI6IGZhbHNlLFxyXG4gICAgXCJJbmNvbXBhdGlibGVcIjogZmFsc2UsXHJcbiAgICBcIlRvb01hbnlcIjogZmFsc2VcclxuICB9LFxyXG4gIFwiUmVjdXJyZW5jZU9jY3VycmVuY2VzXCI6IG51bGwsXHJcbiAgXCJSZWFkT25seVwiOiBmYWxzZVxyXG59Ki9cclxuXHJcbmZ1bmN0aW9uIFJlY3VycmVuY2VSdWxlKHZhbHVlcykge1xyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgZnJlcXVlbmN5VHlwZUlEOiAwLFxyXG4gICAgICAgIGludGVydmFsOiAxLCAvLzpJbnRlZ2VyXHJcbiAgICAgICAgdW50aWw6IG51bGwsIC8vOkRhdGVcclxuICAgICAgICBjb3VudDogbnVsbCwgLy86SW50ZWdlclxyXG4gICAgICAgIGVuZGluZzogbnVsbCwgLy8gOnN0cmluZyBQb3NzaWJsZSB2YWx1ZXMgYWxsb3dlZDogJ25ldmVyJywgJ2RhdGUnLCAnb2N1cnJlbmNlcydcclxuICAgICAgICBzZWxlY3RlZFdlZWtEYXlzOiBbXSwgLy8gOmludGVnZXJbXSAwOlN1bmRheVxyXG4gICAgICAgIG1vbnRobHlXZWVrRGF5OiBmYWxzZSxcclxuICAgICAgICBpbmNvbXBhdGlibGU6IGZhbHNlLFxyXG4gICAgICAgIHRvb01hbnk6IGZhbHNlXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBSZWN1cnJlbmNlT2NjdXJyZW5jZSh2YWx1ZXMpIHtcclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbnVsbCwgLy86RGF0ZVxyXG4gICAgICAgIGVuZFRpbWU6IG51bGwgLy86RGF0ZVxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG4gICBcclxuZnVuY3Rpb24gQ2FsZW5kYXJFdmVudCh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIC8vIFNwZWNpYWwgdmFsdWVzOiBkYXRlcyBtdXN0IGJlIGNvbnZlcnRlZFxyXG4gICAgLy8gdG8gYSBEYXRlIG9iamVjdC4gVGhleSBjb21lIGFzIElTTyBzdHJpbmdcclxuICAgIC8vIFRPRE86IE1ha2UgdGhpcyBzb21ldGhpbmcgZ2VuZXJpYywgb3IgZXZlbiBpbiBNb2RlbCBkZWZpbml0aW9ucyxcclxuICAgIC8vIGFuZCB1c2UgZm9yIHVwZGF0ZWQvY3JlYXRlZERhdGUgYXJvdW5kIGFsbCB0aGUgcHJvamVjdFxyXG4gICAgaWYgKHZhbHVlcykge1xyXG4gICAgICAgIHZhbHVlcy5zdGFydFRpbWUgPSB2YWx1ZXMuc3RhcnRUaW1lICYmIG5ldyBEYXRlKERhdGUucGFyc2UodmFsdWVzLnN0YXJ0VGltZSkpIHx8IG51bGw7XHJcbiAgICAgICAgdmFsdWVzLmVuZFRpbWUgPSB2YWx1ZXMuZW5kVGltZSAmJiBuZXcgRGF0ZShEYXRlLnBhcnNlKHZhbHVlcy5lbmRUaW1lKSkgfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGNhbGVuZGFyRXZlbnRJRDogMCxcclxuICAgICAgICB1c2VySUQ6IDAsXHJcbiAgICAgICAgZXZlbnRUeXBlSUQ6IDMsXHJcbiAgICAgICAgc3VtbWFyeTogJycsXHJcbiAgICAgICAgYXZhaWxhYmlsaXR5VHlwZUlEOiAwLFxyXG4gICAgICAgIHN0YXJ0VGltZTogbnVsbCxcclxuICAgICAgICBlbmRUaW1lOiBudWxsLFxyXG4gICAgICAgIGtpbmQ6IDAsXHJcbiAgICAgICAgaXNBbGxEYXk6IGZhbHNlLFxyXG4gICAgICAgIHRpbWVab25lOiAnWicsXHJcbiAgICAgICAgbG9jYXRpb246IG51bGwsXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICcnLFxyXG4gICAgICAgIHJlYWRPbmx5OiBmYWxzZVxyXG4gICAgfSwgdmFsdWVzKTtcclxuXHJcbiAgICB0aGlzLnJlY3VycmVuY2VSdWxlID0ga28ub2JzZXJ2YWJsZShcclxuICAgICAgICB2YWx1ZXMgJiYgXHJcbiAgICAgICAgdmFsdWVzLnJlY3VycmVuY2VSdWxlICYmIFxyXG4gICAgICAgIG5ldyBSZWN1cnJlbmNlUnVsZSh2YWx1ZXMucmVjdXJyZW5jZVJ1bGUpXHJcbiAgICApO1xyXG4gICAgdGhpcy5yZWN1cnJlbmNlT2NjdXJyZW5jZXMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pOyAvLzpSZWN1cnJlbmNlT2NjdXJyZW5jZVtdXHJcbiAgICBpZiAodmFsdWVzICYmIHZhbHVlcy5yZWN1cnJlbmNlT2NjdXJyZW5jZXMpIHtcclxuICAgICAgICB2YWx1ZXMucmVjdXJyZW5jZU9jY3VycmVuY2VzLmZvckVhY2goZnVuY3Rpb24ob2NjdXJyZW5jZSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5SZWN1cnJlbmNlT2NjdXJyZW5jZXMucHVzaChuZXcgUmVjdXJyZW5jZU9jY3VycmVuY2Uob2NjdXJyZW5jZSkpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENhbGVuZGFyRXZlbnQ7XHJcblxyXG5DYWxlbmRhckV2ZW50LlJlY3VycmVuY2VSdWxlID0gUmVjdXJyZW5jZVJ1bGU7XHJcbkNhbGVuZGFyRXZlbnQuUmVjdXJyZW5jZU9jY3VycmVuY2UgPSBSZWN1cnJlbmNlT2NjdXJyZW5jZTsiLCIvKipcclxuICAgIENhbGVuZGFyU3luY2luZyBtb2RlbC5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBDYWxlbmRhclN5bmNpbmcodmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBpY2FsRXhwb3J0VXJsOiAnJyxcclxuICAgICAgICBpY2FsSW1wb3J0VXJsOiAnJ1xyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDYWxlbmRhclN5bmNpbmc7XHJcbiIsIi8qKiBDbGllbnQgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbi8vIFRPRE8gRG91YmxlIGNoZWNrIFVzZXIsIG11c3QgYmUgdGhlIHNhbWUgb3IgZXh0ZW5kZWQ/P1xyXG5cclxuZnVuY3Rpb24gQ2xpZW50KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBpZDogMCxcclxuICAgICAgICBmaXJzdE5hbWU6ICcnLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnJyxcclxuICAgICAgICBlbWFpbDogJycsXHJcbiAgICAgICAgcGhvbmU6IG51bGwsXHJcbiAgICAgICAgY2FuUmVjZWl2ZVNtczogZmFsc2UsXHJcbiAgICAgICAgYmlydGhNb250aERheTogbnVsbCxcclxuICAgICAgICBiaXJ0aE1vbnRoOiBudWxsLFxyXG4gICAgICAgIG5vdGVzQWJvdXRDbGllbnQ6IG51bGxcclxuICAgIH0sIHZhbHVlcyk7XHJcblxyXG4gICAgdGhpcy5mdWxsTmFtZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKHRoaXMuZmlyc3ROYW1lKCkgKyAnICcgKyB0aGlzLmxhc3ROYW1lKCkpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuYmlydGhEYXkgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYmlydGhNb250aERheSgpICYmXHJcbiAgICAgICAgICAgIHRoaXMuYmlydGhNb250aCgpKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBUT0RPIGkxMG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmlydGhNb250aCgpICsgJy8nICsgdGhpcy5iaXJ0aE1vbnRoRGF5KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDbGllbnQ7XHJcbiIsIi8qKiBHZXRNb3JlIG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBMaXN0Vmlld0l0ZW0gPSByZXF1aXJlKCcuL0xpc3RWaWV3SXRlbScpO1xyXG5cclxuZnVuY3Rpb24gR2V0TW9yZSh2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGF2YWlsYWJpbGl0eTogZmFsc2UsXHJcbiAgICAgICAgcGF5bWVudHM6IGZhbHNlLFxyXG4gICAgICAgIHByb2ZpbGU6IGZhbHNlLFxyXG4gICAgICAgIGNvb3A6IHRydWVcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHZhciBhdmFpbGFibGVJdGVtcyA9IHtcclxuICAgICAgICBhdmFpbGFiaWxpdHk6IG5ldyBMaXN0Vmlld0l0ZW0oe1xyXG4gICAgICAgICAgICBjb250ZW50TGluZTE6ICdDb21wbGV0ZSB5b3VyIGF2YWlsYWJpbGl0eSB0byBjcmVhdGUgYSBjbGVhbmVyIGNhbGVuZGFyJyxcclxuICAgICAgICAgICAgbWFya2VySWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tY2FsZW5kYXInLFxyXG4gICAgICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0J1xyXG4gICAgICAgIH0pLFxyXG4gICAgICAgIHBheW1lbnRzOiBuZXcgTGlzdFZpZXdJdGVtKHtcclxuICAgICAgICAgICAgY29udGVudExpbmUxOiAnU3RhcnQgYWNjZXB0aW5nIHBheW1lbnRzIHRocm91Z2ggTG9jb25vbWljcycsXHJcbiAgICAgICAgICAgIG1hcmtlckljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXVzZCcsXHJcbiAgICAgICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tcmlnaHQnXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgcHJvZmlsZTogbmV3IExpc3RWaWV3SXRlbSh7XHJcbiAgICAgICAgICAgIGNvbnRlbnRMaW5lMTogJ0FjdGl2YXRlIHlvdXIgcHJvZmlsZSBpbiB0aGUgbWFya2V0cGxhY2UnLFxyXG4gICAgICAgICAgICBtYXJrZXJJY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi11c2VyJyxcclxuICAgICAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1yaWdodCdcclxuICAgICAgICB9KSxcclxuICAgICAgICBjb29wOiBuZXcgTGlzdFZpZXdJdGVtKHtcclxuICAgICAgICAgICAgY29udGVudExpbmUxOiAnTGVhcm4gbW9yZSBhYm91dCBvdXIgY29vcGVyYXRpdmUnLFxyXG4gICAgICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0J1xyXG4gICAgICAgIH0pXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXRlbXMgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGl0ZW1zID0gW107XHJcbiAgICAgICAgXHJcbiAgICAgICAgT2JqZWN0LmtleXMoYXZhaWxhYmxlSXRlbXMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAodGhpc1trZXldKCkpXHJcbiAgICAgICAgICAgICAgICBpdGVtcy5wdXNoKGF2YWlsYWJsZUl0ZW1zW2tleV0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBpdGVtcztcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEdldE1vcmU7XHJcbiIsIi8qKiBKb2JUaXRsZSBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgSm9iVGl0bGVQcmljaW5nVHlwZSA9IHJlcXVpcmUoJy4vSm9iVGl0bGVQcmljaW5nVHlwZScpO1xyXG5cclxuZnVuY3Rpb24gSm9iVGl0bGUodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGpvYlRpdGxlSUQ6IDAsXHJcbiAgICAgICAgc2luZ3VsYXJOYW1lOiAnJyxcclxuICAgICAgICBwbHVyYWxOYW1lOiAnJyxcclxuICAgICAgICBhbGlhc2VzOiAnJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBzZWFyY2hEZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZklEKFsnam9iVGl0bGVJRCddKTtcclxuXHJcbiAgICAvLyBQcmljaW5nIFR5cGVzIHJlbGF0aW9uc2hpcCxcclxuICAgIC8vIGNvbGxlY3Rpb24gb2YgSm9iVGl0bGVQcmljaW5nVHlwZSBlbnRpdGllc1xyXG4gICAgdGhpcy5wcmljaW5nVHlwZXMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xyXG4gICAgaWYgKHZhbHVlcyAmJiB2YWx1ZXMucHJpY2luZ1R5cGVzKSB7XHJcbiAgICAgICAgdmFsdWVzLnByaWNpbmdUeXBlcy5mb3JFYWNoKGZ1bmN0aW9uKGpvYnByaWNpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5wcmljaW5nVHlwZXMucHVzaChuZXcgSm9iVGl0bGVQcmljaW5nVHlwZShqb2JwcmljaW5nKSk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBKb2JUaXRsZTtcclxuIiwiLyoqXHJcbiAgICBEZWZpbmVzIHRoZSByZWxhdGlvbnNoaXAgYmV0d2VlbiBhIEpvYlRpdGxlIGFuZCBhIFByaWNpbmdUeXBlLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gSm9iVGl0bGVQcmljaW5nVHlwZSh2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBwcmljaW5nVHlwZUlEOiAwLFxyXG4gICAgICAgIC8vIE5PVEU6IENsaWVudCBUeXBlIGlzIG1vc3RseSB1bnVzZWQgdG9kYXkgYnV0IGV4aXN0c1xyXG4gICAgICAgIC8vIG9uIGFsbCBkYXRhYmFzZSByZWNvcmRzLiBJdCB1c2VzIHRoZSBkZWZhdWx0IHZhbHVlXHJcbiAgICAgICAgLy8gb2YgMSBhbGwgdGhlIHRpbWUgZm9yIG5vdy5cclxuICAgICAgICBjbGllbnRUeXBlSUQ6IDEsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGxcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmSUQoWydwcmljaW5nVHlwZUlEJywgJ2NsaWVudFR5cGVJRCddKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBKb2JUaXRsZVByaWNpbmdUeXBlO1xyXG4iLCIvKiogTGlzdFZpZXdJdGVtIG1vZGVsLlxyXG5cclxuICAgIERlc2NyaWJlcyBhIGdlbmVyaWMgaXRlbSBvZiBhXHJcbiAgICBMaXN0VmlldyBjb21wb25lbnQuXHJcbiAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gTGlzdFZpZXdJdGVtKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIG1hcmtlckxpbmUxOiBudWxsLFxyXG4gICAgICAgIG1hcmtlckxpbmUyOiBudWxsLFxyXG4gICAgICAgIG1hcmtlckljb246IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgY29udGVudExpbmUxOiAnJyxcclxuICAgICAgICBjb250ZW50TGluZTI6IG51bGwsXHJcbiAgICAgICAgbGluazogJyMnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgY2xhc3NOYW1lczogJydcclxuXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExpc3RWaWV3SXRlbTtcclxuIiwiLyoqIExvY2F0aW9uIG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBMb2NhdGlvbih2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBsb2NhdGlvbklEOiAwLFxyXG4gICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgIGFkZHJlc3NMaW5lMTogbnVsbCxcclxuICAgICAgICBhZGRyZXNzTGluZTI6IG51bGwsXHJcbiAgICAgICAgY2l0eTogbnVsbCxcclxuICAgICAgICBzdGF0ZVByb3ZpbmNlQ29kZTogbnVsbCxcclxuICAgICAgICBzdGF0ZVByb3ZpY2VJRDogbnVsbCxcclxuICAgICAgICBwb3N0YWxDb2RlOiBudWxsLFxyXG4gICAgICAgIHBvc3RhbENvZGVJRDogbnVsbCxcclxuICAgICAgICBjb3VudHJ5SUQ6IG51bGwsXHJcbiAgICAgICAgbGF0aXR1ZGU6IG51bGwsXHJcbiAgICAgICAgbG9uZ2l0dWRlOiBudWxsLFxyXG4gICAgICAgIHNwZWNpYWxJbnN0cnVjdGlvbnM6IG51bGwsXHJcbiAgICAgICAgaXNTZXJ2aWNlUmFkaXVzOiBmYWxzZSxcclxuICAgICAgICBpc1NlcnZpY2VMb2NhdGlvbjogZmFsc2UsXHJcbiAgICAgICAgc2VydmljZVJhZGl1czogMFxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5zaW5nbGVMaW5lID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGxpc3QgPSBbXHJcbiAgICAgICAgICAgIHRoaXMuYWRkcmVzc0xpbmUxKCksXHJcbiAgICAgICAgICAgIHRoaXMuY2l0eSgpLFxyXG4gICAgICAgICAgICB0aGlzLnBvc3RhbENvZGUoKSxcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZVByb3ZpbmNlQ29kZSgpXHJcbiAgICAgICAgXTtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbGlzdC5maWx0ZXIoZnVuY3Rpb24odikgeyByZXR1cm4gISF2OyB9KS5qb2luKCcsICcpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuY291bnRyeU5hbWUgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmNvdW50cnlJRCgpID09PSAxID9cclxuICAgICAgICAgICAgJ1VuaXRlZCBTdGF0ZXMnIDpcclxuICAgICAgICAgICAgdGhpcy5jb3VudHJ5SUQoKSA9PT0gMiA/XHJcbiAgICAgICAgICAgICdTcGFpbicgOlxyXG4gICAgICAgICAgICAndW5rbm93J1xyXG4gICAgICAgICk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5jb3VudHJ5Q29kZUFscGhhMiA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMuY291bnRyeUlEKCkgPT09IDEgP1xyXG4gICAgICAgICAgICAnVVMnIDpcclxuICAgICAgICAgICAgdGhpcy5jb3VudHJ5SUQoKSA9PT0gMiA/XHJcbiAgICAgICAgICAgICdFUycgOlxyXG4gICAgICAgICAgICAnJ1xyXG4gICAgICAgICk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5sYXRsbmcgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBsYXQ6IHRoaXMubGF0aXR1ZGUoKSxcclxuICAgICAgICAgICAgbG5nOiB0aGlzLmxvbmdpdHVkZSgpXHJcbiAgICAgICAgfTtcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExvY2F0aW9uO1xyXG4iLCIvKiogTWFpbEZvbGRlciBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xyXG5cclxuZnVuY3Rpb24gTWFpbEZvbGRlcih2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIG1lc3NhZ2VzOiBbXSxcclxuICAgICAgICB0b3BOdW1iZXI6IDEwXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnRvcCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbiB0b3AobnVtKSB7XHJcbiAgICAgICAgaWYgKG51bSkgdGhpcy50b3BOdW1iZXIobnVtKTtcclxuICAgICAgICByZXR1cm4gXy5maXJzdCh0aGlzLm1lc3NhZ2VzKCksIHRoaXMudG9wTnVtYmVyKCkpO1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWFpbEZvbGRlcjtcclxuIiwiLyoqIE1hcmtldHBsYWNlUHJvZmlsZSBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gTWFya2V0cGxhY2VQcm9maWxlKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICB1c2VySUQ6IDAsXHJcbiAgICAgICAgXHJcbiAgICAgICAgcHVibGljQmlvOiAnJyxcclxuICAgICAgICBmcmVlbGFuY2VyUHJvZmlsZVVybFNsdWc6ICcnLFxyXG4gICAgICAgIC8vIFRoaXMgaXMgYSBzZXJ2ZXItc2lkZSBjb21wdXRlZCB2YXJpYWJsZSAocmVhZC1vbmx5IGZvciB0aGUgdXNlcikgZm9yIGEgTG9jb25vbWljcyBhZGRyZXNzXHJcbiAgICAgICAgLy8gY3JlYXRlZCB1c2luZyB0aGUgZnJlZWxhbmNlclByb2ZpbGVVcmxTbHVnIGlmIGFueSBvciB0aGUgZmFsbGJhY2sgc3lzdGVtIFVSTC5cclxuICAgICAgICBmcmVlbGFuY2VyUHJvZmlsZVVybDogJycsXHJcbiAgICAgICAgLy8gU3BlY2lmeSBhbiBleHRlcm5hbCB3ZWJzaXRlIG9mIHRoZSBmcmVlbGFuY2VyLlxyXG4gICAgICAgIGZyZWVsYW5jZXJXZWJzaXRlVXJsOiAnJyxcclxuICAgICAgICAvLyBTZXJ2ZXItc2lkZSBnZW5lcmF0ZWQgY29kZSB0aGF0IGFsbG93cyB0byBpZGVudGlmaWNhdGUgc3BlY2lhbCBib29raW5nIHJlcXVlc3RzXHJcbiAgICAgICAgLy8gZnJvbSB0aGUgYm9vay1tZS1ub3cgYnV0dG9uLiBUaGUgc2VydmVyIGVuc3VyZXMgdGhhdCB0aGVyZSBpcyBldmVyIGEgdmFsdWUgb24gdGhpcyBmb3IgZnJlZWxhbmNlcnMuXHJcbiAgICAgICAgYm9va0NvZGU6ICcnLFxyXG5cclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNYXJrZXRwbGFjZVByb2ZpbGU7XHJcbiIsIi8qKiBNZXNzYWdlIG1vZGVsLlxyXG5cclxuICAgIERlc2NyaWJlcyBhIG1lc3NhZ2UgZnJvbSBhIE1haWxGb2xkZXIuXHJcbiAgICBBIG1lc3NhZ2UgY291bGQgYmUgb2YgZGlmZmVyZW50IHR5cGVzLFxyXG4gICAgYXMgaW5xdWlyaWVzLCBib29raW5ncywgYm9va2luZyByZXF1ZXN0cy5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuLy9UT0RPICAgVGhyZWFkID0gcmVxdWlyZSgnLi9UaHJlYWQnKTtcclxuXHJcbmZ1bmN0aW9uIE1lc3NhZ2UodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgaWQ6IDAsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJycsXHJcbiAgICAgICAgY29udGVudDogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBjbGFzc05hbWVzOiAnJ1xyXG5cclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIC8vIFNtYXJ0IHZpc3VhbGl6YXRpb24gb2YgZGF0ZSBhbmQgdGltZVxyXG4gICAgdGhpcy5kaXNwbGF5ZWREYXRlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBtb21lbnQodGhpcy5jcmVhdGVkRGF0ZSgpKS5sb2NhbGUoJ2VuLVVTLUxDJykuY2FsZW5kYXIoKTtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmRpc3BsYXllZFRpbWUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzLmNyZWF0ZWREYXRlKCkpLmxvY2FsZSgnZW4tVVMtTEMnKS5mb3JtYXQoJ0xUJyk7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNZXNzYWdlO1xyXG4iLCIvKipcclxuICAgIE1vZGVsIGNsYXNzIHRvIGhlbHAgYnVpbGQgbW9kZWxzLlxyXG5cclxuICAgIElzIG5vdCBleGFjdGx5IGFuICdPT1AgYmFzZScgY2xhc3MsIGJ1dCBwcm92aWRlc1xyXG4gICAgdXRpbGl0aWVzIHRvIG1vZGVscyBhbmQgYSBtb2RlbCBkZWZpbml0aW9uIG9iamVjdFxyXG4gICAgd2hlbiBleGVjdXRlZCBpbiB0aGVpciBjb25zdHJ1Y3RvcnMgYXM6XHJcbiAgICBcclxuICAgICcnJ1xyXG4gICAgZnVuY3Rpb24gTXlNb2RlbCgpIHtcclxuICAgICAgICBNb2RlbCh0aGlzKTtcclxuICAgICAgICAvLyBOb3csIHRoZXJlIGlzIGEgdGhpcy5tb2RlbCBwcm9wZXJ0eSB3aXRoXHJcbiAgICAgICAgLy8gYW4gaW5zdGFuY2Ugb2YgdGhlIE1vZGVsIGNsYXNzLCB3aXRoIFxyXG4gICAgICAgIC8vIHV0aWxpdGllcyBhbmQgbW9kZWwgc2V0dGluZ3MuXHJcbiAgICB9XHJcbiAgICAnJydcclxuICAgIFxyXG4gICAgVGhhdCBhdXRvIGNyZWF0aW9uIG9mICdtb2RlbCcgcHJvcGVydHkgY2FuIGJlIGF2b2lkZWRcclxuICAgIHdoZW4gdXNpbmcgdGhlIG9iamVjdCBpbnN0YW50aWF0aW9uIHN5bnRheCAoJ25ldycga2V5d29yZCk6XHJcbiAgICBcclxuICAgICcnJ1xyXG4gICAgdmFyIG1vZGVsID0gbmV3IE1vZGVsKG9iaik7XHJcbiAgICAvLyBUaGVyZSBpcyBubyBhICdvYmoubW9kZWwnIHByb3BlcnR5LCBjYW4gYmVcclxuICAgIC8vIGFzc2lnbmVkIHRvIHdoYXRldmVyIHByb3BlcnR5IG9yIG5vdGhpbmcuXHJcbiAgICAnJydcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxua28ubWFwcGluZyA9IHJlcXVpcmUoJ2tub2Nrb3V0Lm1hcHBpbmcnKTtcclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGNsb25lID0gZnVuY3Rpb24ob2JqKSB7IHJldHVybiAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqKTsgfTtcclxuXHJcbmZ1bmN0aW9uIE1vZGVsKG1vZGVsT2JqZWN0KSB7XHJcbiAgICBcclxuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBNb2RlbCkpIHtcclxuICAgICAgICAvLyBFeGVjdXRlZCBhcyBhIGZ1bmN0aW9uLCBpdCBtdXN0IGNyZWF0ZVxyXG4gICAgICAgIC8vIGEgTW9kZWwgaW5zdGFuY2VcclxuICAgICAgICB2YXIgbW9kZWwgPSBuZXcgTW9kZWwobW9kZWxPYmplY3QpO1xyXG4gICAgICAgIC8vIGFuZCByZWdpc3RlciBhdXRvbWF0aWNhbGx5IGFzIHBhcnRcclxuICAgICAgICAvLyBvZiB0aGUgbW9kZWxPYmplY3QgaW4gJ21vZGVsJyBwcm9wZXJ0eVxyXG4gICAgICAgIG1vZGVsT2JqZWN0Lm1vZGVsID0gbW9kZWw7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gUmV0dXJucyB0aGUgaW5zdGFuY2VcclxuICAgICAgICByZXR1cm4gbW9kZWw7XHJcbiAgICB9XHJcbiBcclxuICAgIC8vIEl0IGluY2x1ZGVzIGEgcmVmZXJlbmNlIHRvIHRoZSBvYmplY3RcclxuICAgIHRoaXMubW9kZWxPYmplY3QgPSBtb2RlbE9iamVjdDtcclxuICAgIC8vIEl0IG1haW50YWlucyBhIGxpc3Qgb2YgcHJvcGVydGllcyBhbmQgZmllbGRzXHJcbiAgICB0aGlzLnByb3BlcnRpZXNMaXN0ID0gW107XHJcbiAgICB0aGlzLmZpZWxkc0xpc3QgPSBbXTtcclxuICAgIC8vIEl0IGFsbG93IHNldHRpbmcgdGhlICdrby5tYXBwaW5nLmZyb21KUycgbWFwcGluZyBvcHRpb25zXHJcbiAgICAvLyB0byBjb250cm9sIGNvbnZlcnNpb25zIGZyb20gcGxhaW4gSlMgb2JqZWN0cyB3aGVuIFxyXG4gICAgLy8gJ3VwZGF0ZVdpdGgnLlxyXG4gICAgdGhpcy5tYXBwaW5nT3B0aW9ucyA9IHt9O1xyXG4gICAgXHJcbiAgICAvLyBUaW1lc3RhbXAgd2l0aCB0aGUgZGF0ZSBvZiBsYXN0IGNoYW5nZVxyXG4gICAgLy8gaW4gdGhlIGRhdGEgKGF1dG9tYXRpY2FsbHkgdXBkYXRlZCB3aGVuIGNoYW5nZXNcclxuICAgIC8vIGhhcHBlbnMgb24gcHJvcGVydGllczsgZmllbGRzIG9yIGFueSBvdGhlciBtZW1iZXJcclxuICAgIC8vIGFkZGVkIHRvIHRoZSBtb2RlbCBjYW5ub3QgYmUgb2JzZXJ2ZWQgZm9yIGNoYW5nZXMsXHJcbiAgICAvLyByZXF1aXJpbmcgbWFudWFsIHVwZGF0aW5nIHdpdGggYSAnbmV3IERhdGUoKScsIGJ1dCBpc1xyXG4gICAgLy8gYmV0dGVyIHRvIHVzZSBwcm9wZXJ0aWVzLlxyXG4gICAgLy8gSXRzIHJhdGVkIHRvIHplcm8ganVzdCB0byBhdm9pZCB0aGF0IGNvbnNlY3V0aXZlXHJcbiAgICAvLyBzeW5jaHJvbm91cyBjaGFuZ2VzIGVtaXQgbG90IG9mIG5vdGlmaWNhdGlvbnMsIHNwZWNpYWxseVxyXG4gICAgLy8gd2l0aCBidWxrIHRhc2tzIGxpa2UgJ3VwZGF0ZVdpdGgnLlxyXG4gICAgdGhpcy5kYXRhVGltZXN0YW1wID0ga28ub2JzZXJ2YWJsZShuZXcgRGF0ZSgpKS5leHRlbmQoeyByYXRlTGltaXQ6IDAgfSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTW9kZWw7XHJcblxyXG4vKipcclxuICAgIERlZmluZSBvYnNlcnZhYmxlIHByb3BlcnRpZXMgdXNpbmcgdGhlIGdpdmVuXHJcbiAgICBwcm9wZXJ0aWVzIG9iamVjdCBkZWZpbml0aW9uIHRoYXQgaW5jbHVkZXMgZGUgZGVmYXVsdCB2YWx1ZXMsXHJcbiAgICBhbmQgc29tZSBvcHRpb25hbCBpbml0aWFsVmFsdWVzIChub3JtYWxseSB0aGF0IGlzIHByb3ZpZGVkIGV4dGVybmFsbHlcclxuICAgIGFzIGEgcGFyYW1ldGVyIHRvIHRoZSBtb2RlbCBjb25zdHJ1Y3Rvciwgd2hpbGUgZGVmYXVsdCB2YWx1ZXMgYXJlXHJcbiAgICBzZXQgaW4gdGhlIGNvbnN0cnVjdG9yKS5cclxuICAgIFRoYXQgcHJvcGVydGllcyBiZWNvbWUgbWVtYmVycyBvZiB0aGUgbW9kZWxPYmplY3QsIHNpbXBsaWZ5aW5nIFxyXG4gICAgbW9kZWwgZGVmaW5pdGlvbnMuXHJcbiAgICBcclxuICAgIEl0IHVzZXMgS25vY2tvdXQub2JzZXJ2YWJsZSBhbmQgb2JzZXJ2YWJsZUFycmF5LCBzbyBwcm9wZXJ0aWVzXHJcbiAgICBhcmUgZnVudGlvbnMgdGhhdCByZWFkcyB0aGUgdmFsdWUgd2hlbiBubyBhcmd1bWVudHMgb3Igc2V0cyB3aGVuXHJcbiAgICBvbmUgYXJndW1lbnQgaXMgcGFzc2VkIG9mLlxyXG4qKi9cclxuTW9kZWwucHJvdG90eXBlLmRlZlByb3BlcnRpZXMgPSBmdW5jdGlvbiBkZWZQcm9wZXJ0aWVzKHByb3BlcnRpZXMsIGluaXRpYWxWYWx1ZXMpIHtcclxuXHJcbiAgICBpbml0aWFsVmFsdWVzID0gaW5pdGlhbFZhbHVlcyB8fCB7fTtcclxuXHJcbiAgICB2YXIgbW9kZWxPYmplY3QgPSB0aGlzLm1vZGVsT2JqZWN0LFxyXG4gICAgICAgIHByb3BlcnRpZXNMaXN0ID0gdGhpcy5wcm9wZXJ0aWVzTGlzdCxcclxuICAgICAgICBkYXRhVGltZXN0YW1wID0gdGhpcy5kYXRhVGltZXN0YW1wO1xyXG5cclxuICAgIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRlZlZhbCA9IHByb3BlcnRpZXNba2V5XTtcclxuICAgICAgICAvLyBDcmVhdGUgb2JzZXJ2YWJsZSBwcm9wZXJ0eSB3aXRoIGRlZmF1bHQgdmFsdWVcclxuICAgICAgICBtb2RlbE9iamVjdFtrZXldID0gQXJyYXkuaXNBcnJheShkZWZWYWwpID9cclxuICAgICAgICAgICAga28ub2JzZXJ2YWJsZUFycmF5KGRlZlZhbCkgOlxyXG4gICAgICAgICAgICBrby5vYnNlcnZhYmxlKGRlZlZhbCk7XHJcbiAgICAgICAgLy8gUmVtZW1iZXIgZGVmYXVsdFxyXG4gICAgICAgIG1vZGVsT2JqZWN0W2tleV0uX2RlZmF1bHRWYWx1ZSA9IGRlZlZhbDtcclxuICAgICAgICAvLyByZW1lbWJlciBpbml0aWFsXHJcbiAgICAgICAgbW9kZWxPYmplY3Rba2V5XS5faW5pdGlhbFZhbHVlID0gaW5pdGlhbFZhbHVlc1trZXldO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIGFuIGluaXRpYWxWYWx1ZSwgc2V0IGl0OlxyXG4gICAgICAgIGlmICh0eXBlb2YoaW5pdGlhbFZhbHVlc1trZXldKSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgbW9kZWxPYmplY3Rba2V5XShpbml0aWFsVmFsdWVzW2tleV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBBZGQgc3Vic2NyaWJlciB0byB1cGRhdGUgdGhlIHRpbWVzdGFtcCBvbiBjaGFuZ2VzXHJcbiAgICAgICAgbW9kZWxPYmplY3Rba2V5XS5zdWJzY3JpYmUoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGRhdGFUaW1lc3RhbXAobmV3IERhdGUoKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQWRkIHRvIHRoZSBpbnRlcm5hbCByZWdpc3RyeVxyXG4gICAgICAgIHByb3BlcnRpZXNMaXN0LnB1c2goa2V5KTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBVcGRhdGUgdGltZXN0YW1wIGFmdGVyIHRoZSBidWxrIGNyZWF0aW9uLlxyXG4gICAgZGF0YVRpbWVzdGFtcChuZXcgRGF0ZSgpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgRGVmaW5lIGZpZWxkcyBhcyBwbGFpbiBtZW1iZXJzIG9mIHRoZSBtb2RlbE9iamVjdCB1c2luZ1xyXG4gICAgdGhlIGZpZWxkcyBvYmplY3QgZGVmaW5pdGlvbiB0aGF0IGluY2x1ZGVzIGRlZmF1bHQgdmFsdWVzLFxyXG4gICAgYW5kIHNvbWUgb3B0aW9uYWwgaW5pdGlhbFZhbHVlcy5cclxuICAgIFxyXG4gICAgSXRzIGxpa2UgZGVmUHJvcGVydGllcywgYnV0IGZvciBwbGFpbiBqcyB2YWx1ZXMgcmF0aGVyIHRoYW4gb2JzZXJ2YWJsZXMuXHJcbioqL1xyXG5Nb2RlbC5wcm90b3R5cGUuZGVmRmllbGRzID0gZnVuY3Rpb24gZGVmRmllbGRzKGZpZWxkcywgaW5pdGlhbFZhbHVlcykge1xyXG5cclxuICAgIGluaXRpYWxWYWx1ZXMgPSBpbml0aWFsVmFsdWVzIHx8IHt9O1xyXG5cclxuICAgIHZhciBtb2RlbE9iamVjdCA9IHRoaXMubW9kZWxPYmplY3QsXHJcbiAgICAgICAgZmllbGRzTGlzdCA9IHRoaXMuZmllbGRzTGlzdDtcclxuXHJcbiAgICBPYmplY3Qua2V5cyhmaWVsZHMpLmVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRlZlZhbCA9IGZpZWxkc1trZXldO1xyXG4gICAgICAgIC8vIENyZWF0ZSBmaWVsZCB3aXRoIGRlZmF1bHQgdmFsdWVcclxuICAgICAgICBtb2RlbE9iamVjdFtrZXldID0gZGVmVmFsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIGFuIGluaXRpYWxWYWx1ZSwgc2V0IGl0OlxyXG4gICAgICAgIGlmICh0eXBlb2YoaW5pdGlhbFZhbHVlc1trZXldKSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgbW9kZWxPYmplY3Rba2V5XSA9IGluaXRpYWxWYWx1ZXNba2V5XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQWRkIHRvIHRoZSBpbnRlcm5hbCByZWdpc3RyeVxyXG4gICAgICAgIGZpZWxkc0xpc3QucHVzaChrZXkpO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIFN0b3JlIHRoZSBsaXN0IG9mIGZpZWxkcyB0aGF0IG1ha2UgdGhlIElEL3ByaW1hcnkga2V5XHJcbiAgICBhbmQgY3JlYXRlIGFuIGFsaWFzICdpZCcgcHJvcGVydHkgdGhhdCByZXR1cm5zIHRoZVxyXG4gICAgdmFsdWUgZm9yIHRoZSBJRCBmaWVsZCBvciBhcnJheSBvZiB2YWx1ZXMgd2hlbiBtdWx0aXBsZVxyXG4gICAgZmllbGRzLlxyXG4qKi9cclxuTW9kZWwucHJvdG90eXBlLmRlZklEID0gZnVuY3Rpb24gZGVmSUQoZmllbGRzTmFtZXMpIHtcclxuICAgIFxyXG4gICAgLy8gU3RvcmUgdGhlIGxpc3RcclxuICAgIHRoaXMuaWRGaWVsZHNOYW1lcyA9IGZpZWxkc05hbWVzO1xyXG4gICAgXHJcbiAgICAvLyBEZWZpbmUgSUQgb2JzZXJ2YWJsZVxyXG4gICAgaWYgKGZpZWxkc05hbWVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIC8vIFJldHVybnMgc2luZ2xlIHZhbHVlXHJcbiAgICAgICAgdmFyIGZpZWxkID0gZmllbGRzTmFtZXNbMF07XHJcbiAgICAgICAgdGhpcy5tb2RlbE9iamVjdC5pZCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbZmllbGRdKCk7XHJcbiAgICAgICAgfSwgdGhpcy5tb2RlbE9iamVjdCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICB0aGlzLm1vZGVsT2JqZWN0LmlkID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmllbGRzTmFtZXMubWFwKGZ1bmN0aW9uKGZpZWxkTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbZmllbGROYW1lXSgpO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgICAgIH0sIHRoaXMubW9kZWxPYmplY3QpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAgICBBbGxvd3MgdG8gcmVnaXN0ZXIgYSBwcm9wZXJ0eSAocHJldmlvdXNseSBkZWZpbmVkKSBhcyBcclxuICAgIHRoZSBtb2RlbCB0aW1lc3RhbXAsIHNvIGdldHMgdXBkYXRlZCBvbiBhbnkgZGF0YSBjaGFuZ2VcclxuICAgIChrZWVwIGluIHN5bmMgd2l0aCB0aGUgaW50ZXJuYWwgZGF0YVRpbWVzdGFtcCkuXHJcbioqL1xyXG5Nb2RlbC5wcm90b3R5cGUucmVnVGltZXN0YW1wID0gZnVuY3Rpb24gcmVnVGltZXN0YW1wUHJvcGVydHkocHJvcGVydHlOYW1lKSB7XHJcblxyXG4gICAgdmFyIHByb3AgPSB0aGlzLm1vZGVsT2JqZWN0W3Byb3BlcnR5TmFtZV07XHJcbiAgICBpZiAodHlwZW9mKHByb3ApICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGVyZSBpcyBubyBvYnNlcnZhYmxlIHByb3BlcnR5IHdpdGggbmFtZSBbJyArIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWUgKyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ10gdG8gcmVnaXN0ZXIgYXMgdGltZXN0YW1wLidcclxuICAgICAgICk7XHJcbiAgICB9XHJcbiAgICAvLyBBZGQgc3Vic2NyaWJlciBvbiBpbnRlcm5hbCB0aW1lc3RhbXAgdG8ga2VlcFxyXG4gICAgLy8gdGhlIHByb3BlcnR5IHVwZGF0ZWRcclxuICAgIHRoaXMuZGF0YVRpbWVzdGFtcC5zdWJzY3JpYmUoZnVuY3Rpb24odGltZXN0YW1wKSB7XHJcbiAgICAgICAgcHJvcCh0aW1lc3RhbXApO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIFJldHVybnMgYSBwbGFpbiBvYmplY3Qgd2l0aCB0aGUgcHJvcGVydGllcyBhbmQgZmllbGRzXHJcbiAgICBvZiB0aGUgbW9kZWwgb2JqZWN0LCBqdXN0IHZhbHVlcy5cclxuICAgIFxyXG4gICAgQHBhcmFtIGRlZXBDb3B5OmJvb2wgSWYgbGVmdCB1bmRlZmluZWQsIGRvIG5vdCBjb3B5IG9iamVjdHMgaW5cclxuICAgIHZhbHVlcyBhbmQgbm90IHJlZmVyZW5jZXMuIElmIGZhbHNlLCBkbyBhIHNoYWxsb3cgY29weSwgc2V0dGluZ1xyXG4gICAgdXAgcmVmZXJlbmNlcyBpbiB0aGUgcmVzdWx0LiBJZiB0cnVlLCB0byBhIGRlZXAgY29weSBvZiBhbGwgb2JqZWN0cy5cclxuKiovXHJcbk1vZGVsLnByb3RvdHlwZS50b1BsYWluT2JqZWN0ID0gZnVuY3Rpb24gdG9QbGFpbk9iamVjdChkZWVwQ29weSkge1xyXG5cclxuICAgIHZhciBwbGFpbiA9IHt9LFxyXG4gICAgICAgIG1vZGVsT2JqID0gdGhpcy5tb2RlbE9iamVjdDtcclxuXHJcbiAgICBmdW5jdGlvbiBzZXRWYWx1ZShwcm9wZXJ0eSwgdmFsKSB7XHJcbiAgICAgICAgLypqc2hpbnQgbWF4Y29tcGxleGl0eTogMTAqL1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICh0eXBlb2YodmFsKSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgaWYgKGRlZXBDb3B5ID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgRGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEEgZGF0ZSBjbG9uZVxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IG5ldyBEYXRlKHZhbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh2YWwgJiYgdmFsLm1vZGVsIGluc3RhbmNlb2YgTW9kZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBBIG1vZGVsIGNvcHlcclxuICAgICAgICAgICAgICAgICAgICBwbGFpbltwcm9wZXJ0eV0gPSB2YWwubW9kZWwudG9QbGFpbk9iamVjdChkZWVwQ29weSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh2YWwgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBwbGFpbltwcm9wZXJ0eV0gPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUGxhaW4gJ3N0YW5kYXJkJyBvYmplY3QgY2xvbmVcclxuICAgICAgICAgICAgICAgICAgICBwbGFpbltwcm9wZXJ0eV0gPSBjbG9uZSh2YWwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGRlZXBDb3B5ID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gU2hhbGxvdyBjb3B5XHJcbiAgICAgICAgICAgICAgICBwbGFpbltwcm9wZXJ0eV0gPSB2YWw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gT24gZWxzZSwgZG8gbm90aGluZywgbm8gcmVmZXJlbmNlcywgbm8gY2xvbmVzXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBwbGFpbltwcm9wZXJ0eV0gPSB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMucHJvcGVydGllc0xpc3QuZm9yRWFjaChmdW5jdGlvbihwcm9wZXJ0eSkge1xyXG4gICAgICAgIC8vIFByb3BlcnRpZXMgYXJlIG9ic2VydmFibGVzLCBzbyBmdW5jdGlvbnMgd2l0aG91dCBwYXJhbXM6XHJcbiAgICAgICAgdmFyIHZhbCA9IG1vZGVsT2JqW3Byb3BlcnR5XSgpO1xyXG5cclxuICAgICAgICBzZXRWYWx1ZShwcm9wZXJ0eSwgdmFsKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuZmllbGRzTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKGZpZWxkKSB7XHJcbiAgICAgICAgLy8gRmllbGRzIGFyZSBqdXN0IHBsYWluIG9iamVjdCBtZW1iZXJzIGZvciB2YWx1ZXMsIGp1c3QgY29weTpcclxuICAgICAgICB2YXIgdmFsID0gbW9kZWxPYmpbZmllbGRdO1xyXG5cclxuICAgICAgICBzZXRWYWx1ZShmaWVsZCwgdmFsKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBwbGFpbjtcclxufTtcclxuXHJcbk1vZGVsLnByb3RvdHlwZS51cGRhdGVXaXRoID0gZnVuY3Rpb24gdXBkYXRlV2l0aChkYXRhLCBkZWVwQ29weSkge1xyXG4gICAgXHJcbiAgICAvLyBXZSBuZWVkIGEgcGxhaW4gb2JqZWN0IGZvciAnZnJvbUpTJy5cclxuICAgIC8vIElmIGlzIGEgbW9kZWwsIGV4dHJhY3QgdGhlaXIgcHJvcGVydGllcyBhbmQgZmllbGRzIGZyb21cclxuICAgIC8vIHRoZSBvYnNlcnZhYmxlcyAoZnJvbUpTKSwgc28gd2Ugbm90IGdldCBjb21wdXRlZFxyXG4gICAgLy8gb3IgZnVuY3Rpb25zLCBqdXN0IHJlZ2lzdGVyZWQgcHJvcGVydGllcyBhbmQgZmllbGRzXHJcbiAgICB2YXIgdGltZXN0YW1wID0gbnVsbDtcclxuICAgIGlmIChkYXRhICYmIGRhdGEubW9kZWwgaW5zdGFuY2VvZiBNb2RlbCkge1xyXG5cclxuICAgICAgICAvLyBXZSBuZWVkIHRvIHNldCB0aGUgc2FtZSB0aW1lc3RhbXAsIHNvXHJcbiAgICAgICAgLy8gcmVtZW1iZXIgZm9yIGFmdGVyIHRoZSBmcm9tSlNcclxuICAgICAgICB0aW1lc3RhbXAgPSBkYXRhLm1vZGVsLmRhdGFUaW1lc3RhbXAoKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBSZXBsYWNlIGRhdGEgd2l0aCBhIHBsYWluIGNvcHkgb2YgaXRzZWxmXHJcbiAgICAgICAgZGF0YSA9IGRhdGEubW9kZWwudG9QbGFpbk9iamVjdChkZWVwQ29weSk7XHJcbiAgICB9XHJcblxyXG4gICAga28ubWFwcGluZy5mcm9tSlMoZGF0YSwgdGhpcy5tYXBwaW5nT3B0aW9ucywgdGhpcy5tb2RlbE9iamVjdCk7XHJcbiAgICAvLyBTYW1lIHRpbWVzdGFtcCBpZiBhbnlcclxuICAgIGlmICh0aW1lc3RhbXApXHJcbiAgICAgICAgdGhpcy5tb2RlbE9iamVjdC5tb2RlbC5kYXRhVGltZXN0YW1wKHRpbWVzdGFtcCk7XHJcbn07XHJcblxyXG5Nb2RlbC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZShkYXRhLCBkZWVwQ29weSkge1xyXG4gICAgLy8gR2V0IGEgcGxhaW4gb2JqZWN0IHdpdGggdGhlIG9iamVjdCBkYXRhXHJcbiAgICB2YXIgcGxhaW4gPSB0aGlzLnRvUGxhaW5PYmplY3QoZGVlcENvcHkpO1xyXG4gICAgLy8gQ3JlYXRlIGEgbmV3IG1vZGVsIGluc3RhbmNlLCB1c2luZyB0aGUgc291cmNlIHBsYWluIG9iamVjdFxyXG4gICAgLy8gYXMgaW5pdGlhbCB2YWx1ZXNcclxuICAgIHZhciBjbG9uZWQgPSBuZXcgdGhpcy5tb2RlbE9iamVjdC5jb25zdHJ1Y3RvcihwbGFpbik7XHJcbiAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgY2xvbmVkIHdpdGggdGhlIHByb3ZpZGVkIHBsYWluIGRhdGEgdXNlZFxyXG4gICAgICAgIC8vIHRvIHJlcGxhY2UgdmFsdWVzIG9uIHRoZSBjbG9uZWQgb25lLCBmb3IgcXVpY2sgb25lLXN0ZXAgY3JlYXRpb25cclxuICAgICAgICAvLyBvZiBkZXJpdmVkIG9iamVjdHMuXHJcbiAgICAgICAgY2xvbmVkLm1vZGVsLnVwZGF0ZVdpdGgoZGF0YSk7XHJcbiAgICB9XHJcbiAgICAvLyBDbG9uZWQgbW9kZWwgcmVhZHk6XHJcbiAgICByZXR1cm4gY2xvbmVkO1xyXG59O1xyXG4iLCIvKiogUGVyZm9ybWFuY2VTdW1tYXJ5IG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBMaXN0Vmlld0l0ZW0gPSByZXF1aXJlKCcuL0xpc3RWaWV3SXRlbScpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXHJcbiAgICBudW1lcmFsID0gcmVxdWlyZSgnbnVtZXJhbCcpO1xyXG5cclxuZnVuY3Rpb24gUGVyZm9ybWFuY2VTdW1tYXJ5KHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHZhbHVlcyA9IHZhbHVlcyB8fCB7fTtcclxuXHJcbiAgICB0aGlzLmVhcm5pbmdzID0gbmV3IEVhcm5pbmdzKHZhbHVlcy5lYXJuaW5ncyk7XHJcbiAgICBcclxuICAgIHZhciBlYXJuaW5nc0xpbmUgPSBuZXcgTGlzdFZpZXdJdGVtKCk7XHJcbiAgICBlYXJuaW5nc0xpbmUubWFya2VyTGluZTEgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgbnVtID0gbnVtZXJhbCh0aGlzLmN1cnJlbnRBbW91bnQoKSkuZm9ybWF0KCckMCwwJyk7XHJcbiAgICAgICAgcmV0dXJuIG51bTtcclxuICAgIH0sIHRoaXMuZWFybmluZ3MpO1xyXG4gICAgZWFybmluZ3NMaW5lLmNvbnRlbnRMaW5lMSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRDb25jZXB0KCk7XHJcbiAgICB9LCB0aGlzLmVhcm5pbmdzKTtcclxuICAgIGVhcm5pbmdzTGluZS5tYXJrZXJMaW5lMiA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBudW0gPSBudW1lcmFsKHRoaXMubmV4dEFtb3VudCgpKS5mb3JtYXQoJyQwLDAnKTtcclxuICAgICAgICByZXR1cm4gbnVtO1xyXG4gICAgfSwgdGhpcy5lYXJuaW5ncyk7XHJcbiAgICBlYXJuaW5nc0xpbmUuY29udGVudExpbmUyID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dENvbmNlcHQoKTtcclxuICAgIH0sIHRoaXMuZWFybmluZ3MpO1xyXG4gICAgXHJcblxyXG4gICAgdGhpcy50aW1lQm9va2VkID0gbmV3IFRpbWVCb29rZWQodmFsdWVzLnRpbWVCb29rZWQpO1xyXG5cclxuICAgIHZhciB0aW1lQm9va2VkTGluZSA9IG5ldyBMaXN0Vmlld0l0ZW0oKTtcclxuICAgIHRpbWVCb29rZWRMaW5lLm1hcmtlckxpbmUxID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIG51bSA9IG51bWVyYWwodGhpcy5wZXJjZW50KCkpLmZvcm1hdCgnMCUnKTtcclxuICAgICAgICByZXR1cm4gbnVtO1xyXG4gICAgfSwgdGhpcy50aW1lQm9va2VkKTtcclxuICAgIHRpbWVCb29rZWRMaW5lLmNvbnRlbnRMaW5lMSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbmNlcHQoKTtcclxuICAgIH0sIHRoaXMudGltZUJvb2tlZCk7XHJcbiAgICBcclxuICAgIFxyXG4gICAgdGhpcy5pdGVtcyA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcclxuICAgICAgICBcclxuICAgICAgICBpdGVtcy5wdXNoKGVhcm5pbmdzTGluZSk7XHJcbiAgICAgICAgaXRlbXMucHVzaCh0aW1lQm9va2VkTGluZSk7XHJcblxyXG4gICAgICAgIHJldHVybiBpdGVtcztcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBlcmZvcm1hbmNlU3VtbWFyeTtcclxuXHJcbmZ1bmN0aW9uIEVhcm5pbmdzKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgXHJcbiAgICAgICAgIGN1cnJlbnRBbW91bnQ6IDAsXHJcbiAgICAgICAgIGN1cnJlbnRDb25jZXB0VGVtcGxhdGU6ICdhbHJlYWR5IHBhaWQgdGhpcyBtb250aCcsXHJcbiAgICAgICAgIG5leHRBbW91bnQ6IDAsXHJcbiAgICAgICAgIG5leHRDb25jZXB0VGVtcGxhdGU6ICdwcm9qZWN0ZWQge21vbnRofSBlYXJuaW5ncydcclxuXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmN1cnJlbnRDb25jZXB0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgbW9udGggPSBtb21lbnQoKS5mb3JtYXQoJ01NTU0nKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50Q29uY2VwdFRlbXBsYXRlKCkucmVwbGFjZSgvXFx7bW9udGhcXH0vLCBtb250aCk7XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgdGhpcy5uZXh0Q29uY2VwdCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIG1vbnRoID0gbW9tZW50KCkuYWRkKDEsICdtb250aCcpLmZvcm1hdCgnTU1NTScpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5leHRDb25jZXB0VGVtcGxhdGUoKS5yZXBsYWNlKC9cXHttb250aFxcfS8sIG1vbnRoKTtcclxuXHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gVGltZUJvb2tlZCh2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgIFxyXG4gICAgICAgIHBlcmNlbnQ6IDAsXHJcbiAgICAgICAgY29uY2VwdFRlbXBsYXRlOiAnb2YgYXZhaWxhYmxlIHRpbWUgYm9va2VkIGluIHttb250aH0nXHJcbiAgICBcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuY29uY2VwdCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIG1vbnRoID0gbW9tZW50KCkuYWRkKDEsICdtb250aCcpLmZvcm1hdCgnTU1NTScpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbmNlcHRUZW1wbGF0ZSgpLnJlcGxhY2UoL1xce21vbnRoXFx9LywgbW9udGgpO1xyXG5cclxuICAgIH0sIHRoaXMpO1xyXG59XHJcbiIsIi8qKiBQb3NpdGlvbiBtb2RlbC5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBQb3NpdGlvbih2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBwb3NpdGlvbklEOiAwLFxyXG4gICAgICAgIHBvc2l0aW9uU2luZ3VsYXI6ICcnLFxyXG4gICAgICAgIHBvc2l0aW9uUGx1cmFsOiAnJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJycsXHJcbiAgICAgICAgYWN0aXZlOiB0cnVlXHJcblxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQb3NpdGlvbjtcclxuIiwiLyoqXHJcbiAgICBQcmljaW5nIFR5cGUgbW9kZWxcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIFByaWNpbmdUeXBlKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBwcmljaW5nVHlwZUlEOiAwLFxyXG4gICAgICAgIHNpbmd1bGFyTmFtZTogJycsXHJcbiAgICAgICAgcGx1cmFsTmFtZTogJycsXHJcbiAgICAgICAgc2x1Z05hbWU6ICcnLFxyXG4gICAgICAgIGFkZE5ld0xhYmVsOiBudWxsLFxyXG4gICAgICAgIGZyZWVsYW5jZXJEZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICAvLyBQcmljZUNhbGN1bGF0aW9uVHlwZSBlbnVtZXJhdGlvbiB2YWx1ZTpcclxuICAgICAgICBwcmljZUNhbGN1bGF0aW9uOiBudWxsLFxyXG4gICAgICAgIGlzQWRkb246IGZhbHNlLFxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEZvcm0gVGV4dHNcclxuICAgICAgICBuYW1lUGxhY2VIb2xkZXI6IG51bGwsXHJcbiAgICAgICAgc3VnZ2VzdGVkTmFtZTogbnVsbCxcclxuICAgICAgICBmaXhlZE5hbWU6IG51bGwsXHJcbiAgICAgICAgZHVyYXRpb25MYWJlbDogbnVsbCxcclxuICAgICAgICBwcmljZUxhYmVsOiBudWxsLFxyXG4gICAgICAgIHByaWNlTm90ZTogbnVsbCxcclxuICAgICAgICBmaXJzdFRpbWVDbGllbnRzT25seUxhYmVsOiBudWxsLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uUGxhY2VIb2xkZXI6IG51bGwsXHJcbiAgICAgICAgcHJpY2VSYXRlUXVhbnRpdHlMYWJlbDogbnVsbCxcclxuICAgICAgICBwcmljZVJhdGVVbml0TGFiZWw6IG51bGwsXHJcbiAgICAgICAgbm9QcmljZVJhdGVMYWJlbDogbnVsbCxcclxuICAgICAgICBudW1iZXJPZlNlc3Npb25zTGFiZWw6IG51bGwsXHJcbiAgICAgICAgaW5QZXJzb25QaG9uZUxhYmVsOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEFjdGlvbiBBbmQgVmFsaWRhdGlvbiBUZXh0c1xyXG4gICAgICAgIHN1Y2Nlc3NPbkRlbGV0ZTogbnVsbCxcclxuICAgICAgICBlcnJvck9uRGVsZXRlOiBudWxsLFxyXG4gICAgICAgIHN1Y2Nlc3NPblNhdmU6IG51bGwsXHJcbiAgICAgICAgZXJyb3JPblNhdmU6IG51bGwsXHJcbiAgICAgICAgcHJpY2VSYXRlSXNSZXF1aXJlZFZhbGlkYXRpb25FcnJvcjogbnVsbCxcclxuICAgICAgICBwcmljZVJhdGVVbml0SXNSZXF1aXJlZFZhbGlkYXRpb25FcnJvcjogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICAvLyBIZWxwIFRleHRzXHJcbiAgICAgICAgbGVhcm5Nb3JlTGFiZWw6IG51bGwsXHJcbiAgICAgICAgbGVhcm5Nb3JlVGV4dDogbnVsbCxcclxuICAgICAgICBwcmljZVJhdGVMZWFybk1vcmVMYWJlbDogbnVsbCxcclxuICAgICAgICBwcmljZVJhdGVMZWFybk1vcmVUZXh0OiBudWxsLFxyXG4gICAgICAgIG5vUHJpY2VSYXRlTGVhcm5Nb3JlTGFiZWw6IG51bGwsXHJcbiAgICAgICAgbm9QcmljZVJhdGVMZWFybk1vcmVUZXh0OiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEFkZGl0aW9uYWwgY29uZmlndXJhdGlvblxyXG4gICAgICAgIHJlcXVpcmVEdXJhdGlvbjogZmFsc2UsXHJcbiAgICAgICAgaW5jbHVkZVNlcnZpY2VBdHRyaWJ1dGVzOiBmYWxzZSxcclxuICAgICAgICBpbmNsdWRlU3BlY2lhbFByb21vdGlvbjogZmFsc2UsXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gTGlzdCBUZXh0c1xyXG4gICAgICAgIC8vLyBTdW1tYXJ5Rm9ybWF0IGlzIHRoZSBkZWZhdWx0IGZvcm1hdCBmb3Igc3VtbWFyaWVzIChyZXF1aXJlZCksXHJcbiAgICAgICAgLy8vIG90aGVyIGZvcm1hdHMgYXJlIGdvb2QgZm9yIGJldHRlciBkZXRhaWwsIGJ1dCBkZXBlbmRzXHJcbiAgICAgICAgLy8vIG9uIG90aGVyIG9wdGlvbnMgY29uZmlndXJlZCBwZXIgdHlwZS5cclxuICAgICAgICAvLy8gV2lsZGNhcmRzOlxyXG4gICAgICAgIC8vLyB7MH06IGR1cmF0aW9uXHJcbiAgICAgICAgLy8vIHsxfTogc2Vzc2lvbnNcclxuICAgICAgICAvLy8gezJ9OiBpbnBlcnNvbi9waG9uZVxyXG4gICAgICAgIHN1bW1hcnlGb3JtYXQ6IG51bGwsXHJcbiAgICAgICAgc3VtbWFyeUZvcm1hdE11bHRpcGxlU2Vzc2lvbnM6IG51bGwsXHJcbiAgICAgICAgc3VtbWFyeUZvcm1hdE5vRHVyYXRpb246IG51bGwsXHJcbiAgICAgICAgc3VtbWFyeUZvcm1hdE11bHRpcGxlU2Vzc2lvbnNOb0R1cmF0aW9uOiBudWxsLFxyXG4gICAgICAgIHdpdGhvdXRTZXJ2aWNlQXR0cmlidXRlc0N1c3RvbWVyTWVzc2FnZTogbnVsbCxcclxuICAgICAgICB3aXRob3V0U2VydmljZUF0dHJpYnV0ZXNGcmVlbGFuY2VyTWVzc2FnZTogbnVsbCxcclxuICAgICAgICBmaXJzdFRpbWVDbGllbnRzT25seUxpc3RUZXh0OiBudWxsLFxyXG4gICAgICAgIHByaWNlUmF0ZVF1YW50aXR5TGlzdExhYmVsOiBudWxsLFxyXG4gICAgICAgIHByaWNlUmF0ZVVuaXRMaXN0TGFiZWw6IG51bGwsXHJcbiAgICAgICAgbm9QcmljZVJhdGVMaXN0TWVzc2FnZTogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICAvLyBCb29raW5nL1ByaWNpbmdFc3RpbWF0ZSBUZXh0c1xyXG4gICAgICAgIC8vLyBOYW1lQW5kU3VtbWFyeUZvcm1hdCBpcyB0aGUgZGVmYXVsdCBmb3JtYXQgZm9yIHN1bW1hcmllcyB3aXRoIHBhY2thZ2UgbmFtZSAocmVxdWlyZWQpLFxyXG4gICAgICAgIC8vLyBvdGhlciBmb3JtYXRzIGFyZSBnb29kIGZvciBiZXR0ZXIgZGV0YWlsLCBidXQgZGVwZW5kc1xyXG4gICAgICAgIC8vLyBvbiBvdGhlciBvcHRpb25zIGNvbmZpZ3VyZWQgcGVyIHR5cGUuXHJcbiAgICAgICAgLy8vIFdpbGRjYXJkczpcclxuICAgICAgICAvLy8gezB9OiBwYWNrYWdlIG5hbWVcclxuICAgICAgICAvLy8gezF9OiBkdXJhdGlvblxyXG4gICAgICAgIC8vLyB7Mn06IHNlc3Npb25zXHJcbiAgICAgICAgLy8vIHszfTogaW5wZXJzb24vcGhvbmVcclxuICAgICAgICBuYW1lQW5kU3VtbWFyeUZvcm1hdDogbnVsbCxcclxuICAgICAgICBuYW1lQW5kU3VtbWFyeUZvcm1hdE11bHRpcGxlU2Vzc2lvbnM6IG51bGwsXHJcbiAgICAgICAgbmFtZUFuZFN1bW1hcnlGb3JtYXROb0R1cmF0aW9uOiBudWxsLFxyXG4gICAgICAgIG5hbWVBbmRTdW1tYXJ5Rm9ybWF0TXVsdGlwbGVTZXNzaW9uc05vRHVyYXRpb246IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gUmVjb3JkIG1haW50ZW5hbmNlXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGxcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmSUQoWydwcmljaW5nVHlwZUlEJ10pO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFByaWNpbmdUeXBlO1xyXG5cclxuLy8gRW51bWVyYXRpb246XHJcbnZhciBQcmljZUNhbGN1bGF0aW9uVHlwZSA9IHtcclxuICAgIEZpeGVkUHJpY2U6IDEsXHJcbiAgICBIb3VybHlQcmljZTogMlxyXG59O1xyXG5cclxuUHJpY2luZ1R5cGUuUHJpY2VDYWxjdWxhdGlvblR5cGUgPSBQcmljZUNhbGN1bGF0aW9uVHlwZTtcclxuIiwiLyoqXHJcbiAgICBQcml2YWN5U2V0dGluZ3MgbW9kZWxcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIFByaXZhY3lTZXR0aW5ncyh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgdXNlcklEOiAwLFxyXG4gICAgICAgIHNtc0Jvb2tpbmdDb21tdW5pY2F0aW9uOiBmYWxzZSxcclxuICAgICAgICBwaG9uZUJvb2tpbmdDb21tdW5pY2F0aW9uOiBmYWxzZSxcclxuICAgICAgICBsb2Nvbm9taWNzQ29tbXVuaXR5Q29tbXVuaWNhdGlvbjogZmFsc2UsXHJcbiAgICAgICAgbG9jb25vbWljc0RibUNhbXBhaWduczogZmFsc2UsXHJcbiAgICAgICAgcHJvZmlsZVNlb1Blcm1pc3Npb246IGZhbHNlLFxyXG4gICAgICAgIGxvY29ub21pY3NNYXJrZXRpbmdDYW1wYWlnbnM6IGZhbHNlLFxyXG4gICAgICAgIGNvQnJhbmRlZFBhcnRuZXJQZXJtaXNzaW9uczogZmFsc2UsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGxcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmSUQoWyd1c2VySUQnXSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUHJpdmFjeVNldHRpbmdzO1xyXG4iLCIvKipcclxuICAgIFNjaGVkdWxpbmdQcmVmZXJlbmNlcyBtb2RlbC5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBTY2hlZHVsaW5nUHJlZmVyZW5jZXModmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgYWR2YW5jZVRpbWU6IDI0LFxyXG4gICAgICAgIGJldHdlZW5UaW1lOiAwLFxyXG4gICAgICAgIGluY3JlbWVudHNTaXplSW5NaW51dGVzOiAxNVxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTY2hlZHVsaW5nUHJlZmVyZW5jZXM7XHJcbiIsIi8qKiBTZXJ2aWNlIG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBTZXJ2aWNlKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgIHByaWNlOiAwLFxyXG4gICAgICAgIGR1cmF0aW9uOiAwLCAvLyBpbiBtaW51dGVzXHJcbiAgICAgICAgaXNBZGRvbjogZmFsc2VcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuZHVyYXRpb25UZXh0ID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIG1pbnV0ZXMgPSB0aGlzLmR1cmF0aW9uKCkgfHwgMDtcclxuICAgICAgICAvLyBUT0RPOiBGb3JtYXR0aW5nLCBsb2NhbGl6YXRpb25cclxuICAgICAgICByZXR1cm4gbWludXRlcyA/IG1pbnV0ZXMgKyAnIG1pbnV0ZXMnIDogJyc7XHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZXJ2aWNlO1xyXG4iLCIvKipcclxuICAgIFNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSBtb2RlbC5cclxuICAgIFxyXG4gICAgSXRzICdzaW1wbGlmaWVkJyBiZWNhdXNlIGl0IHByb3ZpZGVzIGFuIEFQSVxyXG4gICAgZm9yIHNpbXBsZSB0aW1lIHJhbmdlIHBlciB3ZWVrIGRheSxcclxuICAgIGEgcGFpciBvZiBmcm9tLXRvIHRpbWVzLlxyXG4gICAgR29vZCBmb3IgY3VycmVudCBzaW1wbGUgVUkuXHJcbiAgICBcclxuICAgIFRoZSBvcmlnaW5hbCB3ZWVrbHkgc2NoZWR1bGUgZGVmaW5lcyB0aGUgc2NoZWR1bGVcclxuICAgIGluIDE1IG1pbnV0ZXMgc2xvdHMsIHNvIG11bHRpcGxlIHRpbWUgcmFuZ2VzIGNhblxyXG4gICAgZXhpc3RzIHBlciB3ZWVrIGRheSwganVzdCBtYXJraW5nIGVhY2ggc2xvdFxyXG4gICAgYXMgYXZhaWxhYmxlIG9yIHVuYXZhaWxhYmxlLiBUaGUgQXBwTW9kZWxcclxuICAgIHdpbGwgZmlsbCB0aGlzIG1vZGVsIGluc3RhbmNlcyBwcm9wZXJseSBtYWtpbmdcclxuICAgIGFueSBjb252ZXJzaW9uIGZyb20vdG8gdGhlIHNvdXJjZSBkYXRhLlxyXG4gKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbi8qKlxyXG4gICAgU3VibW9kZWwgdGhhdCBpcyB1c2VkIG9uIHRoZSBTaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGVcclxuICAgIGRlZmluaW5nIGEgc2luZ2xlIHdlZWsgZGF5IGF2YWlsYWJpbGl0eSByYW5nZS5cclxuICAgIEEgZnVsbCBkYXkgbXVzdCBoYXZlIHZhbHVlcyBmcm9tOjAgdG86MTQ0MCwgbmV2ZXJcclxuICAgIGJvdGggYXMgemVybyBiZWNhdXNlIHRoYXRzIGNvbnNpZGVyZWQgYXMgbm90IGF2YWlsYWJsZSxcclxuICAgIHNvIGlzIGJldHRlciB0byB1c2UgdGhlIGlzQWxsRGF5IHByb3BlcnR5LlxyXG4qKi9cclxuZnVuY3Rpb24gV2Vla0RheVNjaGVkdWxlKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICAvLyBOT1RFOiBmcm9tLXRvIHByb3BlcmllcyBhcyBudW1iZXJzXHJcbiAgICAvLyBmb3IgdGhlIG1pbnV0ZSBvZiB0aGUgZGF5LCBmcm9tIDAgKDAwOjAwKSB0byAxNDM5ICgyMzo1OSlcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgZnJvbTogMCxcclxuICAgICAgICB0bzogMFxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgSXQgYWxsb3dzIHRvIGtub3cgaWYgdGhpcyB3ZWVrIGRheSBpcyBcclxuICAgICAgICBlbmFibGVkIGZvciB3ZWVrbHkgc2NoZWR1bGUsIGp1c3QgaXRcclxuICAgICAgICBoYXMgZnJvbS10byB0aW1lcy5cclxuICAgICAgICBJdCBhbGxvd3MgdG8gYmUgc2V0IGFzIHRydWUgcHV0dGluZ1xyXG4gICAgICAgIGEgZGVmYXVsdCByYW5nZSAoOWEtNXApIG9yIGZhbHNlIFxyXG4gICAgICAgIHNldHRpbmcgYm90aCBhcyAwcC5cclxuICAgICAgICBcclxuICAgICAgICBTaW5jZSBvbiB3cml0ZSB0d28gb2JzZXJ2YWJsZXMgYXJlIGJlaW5nIG1vZGlmaWVkLCBhbmRcclxuICAgICAgICBib3RoIGFyZSB1c2VkIGluIHRoZSByZWFkLCBhIHNpbmdsZSBjaGFuZ2UgdG8gdGhlIFxyXG4gICAgICAgIHZhbHVlIHdpbGwgdHJpZ2dlciB0d28gbm90aWZpY2F0aW9uczsgdG8gYXZvaWQgdGhhdCxcclxuICAgICAgICB0aGUgb2JzZXJ2YWJsZSBpcyByYXRlIGxpbWl0ZWQgd2l0aCBhbiBpbm1lZGlhdGUgdmFsdWUsXHJcbiAgICAgICAgc29uIG9ubHkgb25lIG5vdGlmaWNhdGlvbiBpcyByZWNlaXZlZC5cclxuICAgICoqL1xyXG4gICAgdGhpcy5pc0VuYWJsZWQgPSBrby5jb21wdXRlZCh7XHJcbiAgICAgICAgcmVhZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICB0eXBlb2YodGhpcy5mcm9tKCkpID09PSAnbnVtYmVyJyAmJlxyXG4gICAgICAgICAgICAgICAgdHlwZW9mKHRoaXMudG8oKSkgPT09ICdudW1iZXInICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZyb20oKSA8IHRoaXMudG8oKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgICAgICBpZiAodmFsID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBEZWZhdWx0IHJhbmdlIDlhIC0gNXBcclxuICAgICAgICAgICAgICAgIHRoaXMuZnJvbUhvdXIoOSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvSG91cigxNyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvSG91cigwKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZnJvbSgwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3duZXI6IHRoaXNcclxuICAgIH0pLmV4dGVuZCh7IHJhdGVMaW1pdDogMCB9KTtcclxuICAgIFxyXG4gICAgdGhpcy5pc0FsbERheSA9IGtvLmNvbXB1dGVkKHtcclxuICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuICAoXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZyb20oKSA9PT0gMCAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy50bygpID09PSAxNDQwXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB3cml0ZTogZnVuY3Rpb24oLyp2YWwqLykge1xyXG4gICAgICAgICAgICB0aGlzLmZyb20oMCk7XHJcbiAgICAgICAgICAgIHRoaXMudG8oMTQ0MCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvd25lcjogdGhpc1xyXG4gICAgfSkuZXh0ZW5kKHsgcmF0ZUxpbWl0OiAwIH0pO1xyXG4gICAgXHJcbiAgICAvLyBBZGRpdGlvbmFsIGludGVyZmFjZXMgdG8gZ2V0L3NldCB0aGUgZnJvbS90byB0aW1lc1xyXG4gICAgLy8gYnkgdXNpbmcgYSBkaWZmZXJlbnQgZGF0YSB1bml0IG9yIGZvcm1hdC5cclxuICAgIFxyXG4gICAgLy8gSW50ZWdlciwgcm91bmRlZC11cCwgbnVtYmVyIG9mIGhvdXJzXHJcbiAgICB0aGlzLmZyb21Ib3VyID0ga28uY29tcHV0ZWQoe1xyXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcih0aGlzLmZyb20oKSAvIDYwKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHdyaXRlOiBmdW5jdGlvbihob3Vycykge1xyXG4gICAgICAgICAgICB0aGlzLmZyb20oKGhvdXJzICogNjApIHwwKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG93bmVyOiB0aGlzXHJcbiAgICB9KTtcclxuICAgIHRoaXMudG9Ib3VyID0ga28uY29tcHV0ZWQoe1xyXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5jZWlsKHRoaXMudG8oKSAvIDYwKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHdyaXRlOiBmdW5jdGlvbihob3Vycykge1xyXG4gICAgICAgICAgICB0aGlzLnRvKChob3VycyAqIDYwKSB8MCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvd25lcjogdGhpc1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIFN0cmluZywgdGltZSBmb3JtYXQgKCdoaDptbScpXHJcbiAgICB0aGlzLmZyb21UaW1lID0ga28uY29tcHV0ZWQoe1xyXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbWludXRlc1RvVGltZVN0cmluZyh0aGlzLmZyb20oKSB8MCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB3cml0ZTogZnVuY3Rpb24odGltZSkge1xyXG4gICAgICAgICAgICB0aGlzLmZyb20odGltZVN0cmluZ1RvTWludXRlcyh0aW1lKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvd25lcjogdGhpc1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLnRvVGltZSA9IGtvLmNvbXB1dGVkKHtcclxuICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1pbnV0ZXNUb1RpbWVTdHJpbmcodGhpcy50bygpIHwwKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHdyaXRlOiBmdW5jdGlvbih0aW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMudG8odGltZVN0cmluZ1RvTWludXRlcyh0aW1lKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvd25lcjogdGhpc1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgTWFpbiBtb2RlbCBkZWZpbmluZyB0aGUgd2VlayBzY2hlZHVsZVxyXG4gICAgcGVyIHdlZWsgZGF0ZSwgb3IganVzdCBzZXQgYWxsIGRheXMgdGltZXNcclxuICAgIGFzIGF2YWlsYWJsZSB3aXRoIGEgc2luZ2xlIGZsYWcuXHJcbioqL1xyXG5mdW5jdGlvbiBTaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgc3VuZGF5OiBuZXcgV2Vla0RheVNjaGVkdWxlKCksXHJcbiAgICAgICAgbW9uZGF5OiBuZXcgV2Vla0RheVNjaGVkdWxlKCksXHJcbiAgICAgICAgdHVlc2RheTogbmV3IFdlZWtEYXlTY2hlZHVsZSgpLFxyXG4gICAgICAgIHdlZG5lc2RheTogbmV3IFdlZWtEYXlTY2hlZHVsZSgpLFxyXG4gICAgICAgIHRodXJzZGF5OiBuZXcgV2Vla0RheVNjaGVkdWxlKCksXHJcbiAgICAgICAgZnJpZGF5OiBuZXcgV2Vla0RheVNjaGVkdWxlKCksXHJcbiAgICAgICAgc2F0dXJkYXk6IG5ldyBXZWVrRGF5U2NoZWR1bGUoKSxcclxuICAgICAgICBpc0FsbFRpbWU6IGZhbHNlXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZTtcclxuXHJcbi8vLy8gVVRJTFMsXHJcbi8vIFRPRE8gT3JnYW5pemUgb3IgZXh0ZXJuYWxpemUuIHNvbWUgY29waWVkIGZvcm0gYXBwbW9kZWwuLlxyXG4vKipcclxuICAgIGludGVybmFsIHV0aWxpdHkgZnVuY3Rpb24gJ3RvIHN0cmluZyB3aXRoIHR3byBkaWdpdHMgYWxtb3N0J1xyXG4qKi9cclxuZnVuY3Rpb24gdHdvRGlnaXRzKG4pIHtcclxuICAgIHJldHVybiBNYXRoLmZsb29yKG4gLyAxMCkgKyAnJyArIG4gJSAxMDtcclxufVxyXG5cclxuLyoqXHJcbiAgICBDb252ZXJ0IGEgbnVtYmVyIG9mIG1pbnV0ZXNcclxuICAgIGluIGEgc3RyaW5nIGxpa2U6IDAwOjAwOjAwIChob3VyczptaW51dGVzOnNlY29uZHMpXHJcbioqL1xyXG5mdW5jdGlvbiBtaW51dGVzVG9UaW1lU3RyaW5nKG1pbnV0ZXMpIHtcclxuICAgIHZhciBkID0gbW9tZW50LmR1cmF0aW9uKG1pbnV0ZXMsICdtaW51dGVzJyksXHJcbiAgICAgICAgaCA9IGQuaG91cnMoKSxcclxuICAgICAgICBtID0gZC5taW51dGVzKCksXHJcbiAgICAgICAgcyA9IGQuc2Vjb25kcygpO1xyXG4gICAgXHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgIHR3b0RpZ2l0cyhoKSArICc6JyArXHJcbiAgICAgICAgdHdvRGlnaXRzKG0pICsgJzonICtcclxuICAgICAgICB0d29EaWdpdHMocylcclxuICAgICk7XHJcbn1cclxuXHJcbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuZnVuY3Rpb24gdGltZVN0cmluZ1RvTWludXRlcyh0aW1lKSB7XHJcbiAgICByZXR1cm4gbW9tZW50LmR1cmF0aW9uKHRpbWUpLmFzTWludXRlcygpIHwwO1xyXG59IiwiLyoqIFVwY29taW5nQm9va2luZ3NTdW1tYXJ5IG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBCb29raW5nU3VtbWFyeSA9IHJlcXVpcmUoJy4vQm9va2luZ1N1bW1hcnknKTtcclxuXHJcbmZ1bmN0aW9uIFVwY29taW5nQm9va2luZ3NTdW1tYXJ5KCkge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMudG9kYXkgPSBuZXcgQm9va2luZ1N1bW1hcnkoe1xyXG4gICAgICAgIGNvbmNlcHQ6ICdtb3JlIHRvZGF5JyxcclxuICAgICAgICB0aW1lRm9ybWF0OiAnIFtlbmRpbmcgQF0gaDptbWEnXHJcbiAgICB9KTtcclxuICAgIHRoaXMudG9tb3Jyb3cgPSBuZXcgQm9va2luZ1N1bW1hcnkoe1xyXG4gICAgICAgIGNvbmNlcHQ6ICd0b21vcnJvdycsXHJcbiAgICAgICAgdGltZUZvcm1hdDogJyBbc3RhcnRpbmcgQF0gaDptbWEnXHJcbiAgICB9KTtcclxuICAgIHRoaXMubmV4dFdlZWsgPSBuZXcgQm9va2luZ1N1bW1hcnkoe1xyXG4gICAgICAgIGNvbmNlcHQ6ICduZXh0IHdlZWsnLFxyXG4gICAgICAgIHRpbWVGb3JtYXQ6IG51bGxcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLml0ZW1zID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBpdGVtcyA9IFtdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vaWYgKHRoaXMudG9kYXkucXVhbnRpdHkoKSlcclxuICAgICAgICBpdGVtcy5wdXNoKHRoaXMudG9kYXkpO1xyXG4gICAgICAgIC8vaWYgKHRoaXMudG9tb3Jyb3cucXVhbnRpdHkoKSlcclxuICAgICAgICBpdGVtcy5wdXNoKHRoaXMudG9tb3Jyb3cpO1xyXG4gICAgICAgIC8vaWYgKHRoaXMubmV4dFdlZWsucXVhbnRpdHkoKSlcclxuICAgICAgICBpdGVtcy5wdXNoKHRoaXMubmV4dFdlZWspO1xyXG5cclxuICAgICAgICByZXR1cm4gaXRlbXM7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFVwY29taW5nQm9va2luZ3NTdW1tYXJ5O1xyXG4iLCIvKiogVXNlciBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuLy8gRW51bSBVc2VyVHlwZVxyXG52YXIgVXNlclR5cGUgPSB7XHJcbiAgICBOb25lOiAwLFxyXG4gICAgQW5vbnltb3VzOiAxLFxyXG4gICAgQ3VzdG9tZXI6IDIsXHJcbiAgICBGcmVlbGFuY2VyOiA0LFxyXG4gICAgQWRtaW46IDgsXHJcbiAgICBMb2dnZWRVc2VyOiAxNCxcclxuICAgIFVzZXI6IDE1LFxyXG4gICAgU3lzdGVtOiAxNlxyXG59O1xyXG5cclxuZnVuY3Rpb24gVXNlcih2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgdXNlcklEOiAwLFxyXG4gICAgICAgIGVtYWlsOiAnJyxcclxuICAgICAgICBcclxuICAgICAgICBmaXJzdE5hbWU6ICcnLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnJyxcclxuICAgICAgICBzZWNvbmRMYXN0TmFtZTogJycsXHJcbiAgICAgICAgYnVzaW5lc3NOYW1lOiAnJyxcclxuICAgICAgICBcclxuICAgICAgICBhbHRlcm5hdGl2ZUVtYWlsOiAnJyxcclxuICAgICAgICBwaG9uZTogJycsXHJcbiAgICAgICAgY2FuUmVjZWl2ZVNtczogJycsXHJcbiAgICAgICAgYmlydGhNb250aERheTogbnVsbCxcclxuICAgICAgICBiaXJ0aE1vbnRoOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGlzRnJlZWxhbmNlcjogZmFsc2UsXHJcbiAgICAgICAgaXNDdXN0b21lcjogZmFsc2UsXHJcbiAgICAgICAgaXNNZW1iZXI6IGZhbHNlLFxyXG4gICAgICAgIGlzQWRtaW46IGZhbHNlLFxyXG5cclxuICAgICAgICBvbmJvYXJkaW5nU3RlcDogbnVsbCxcclxuICAgICAgICBhY2NvdW50U3RhdHVzSUQ6IDAsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGxcclxuICAgIH0sIHZhbHVlcyk7XHJcblxyXG4gICAgdGhpcy5mdWxsTmFtZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgbmFtZVBhcnRzID0gW3RoaXMuZmlyc3ROYW1lKCldO1xyXG4gICAgICAgIGlmICh0aGlzLmxhc3ROYW1lKCkpXHJcbiAgICAgICAgICAgIG5hbWVQYXJ0cy5wdXNoKHRoaXMubGFzdE5hbWUoKSk7XHJcbiAgICAgICAgaWYgKHRoaXMuc2Vjb25kTGFzdE5hbWUoKSlcclxuICAgICAgICAgICAgbmFtZVBhcnRzLnB1c2godGhpcy5zZWNvbmRMYXN0TmFtZSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG5hbWVQYXJ0cy5qb2luKCcgJyk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5iaXJ0aERheSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAodGhpcy5iaXJ0aE1vbnRoRGF5KCkgJiZcclxuICAgICAgICAgICAgdGhpcy5iaXJ0aE1vbnRoKCkpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFRPRE8gaTEwblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5iaXJ0aE1vbnRoKCkgKyAnLycgKyB0aGlzLmJpcnRoTW9udGhEYXkoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnVzZXJUeXBlID0ga28ucHVyZUNvbXB1dGVkKHtcclxuICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIGMgPSB0aGlzLmlzQ3VzdG9tZXIoKSxcclxuICAgICAgICAgICAgICAgIHAgPSB0aGlzLmlzRnJlZWxhbmNlcigpLFxyXG4gICAgICAgICAgICAgICAgYSA9IHRoaXMuaXNBZG1pbigpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHVzZXJUeXBlID0gMDtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQW5vbnltb3VzKCkpXHJcbiAgICAgICAgICAgICAgICB1c2VyVHlwZSA9IHVzZXJUeXBlIHwgVXNlclR5cGUuQW5vbnltb3VzO1xyXG4gICAgICAgICAgICBpZiAoYylcclxuICAgICAgICAgICAgICAgIHVzZXJUeXBlID0gdXNlclR5cGUgfCBVc2VyVHlwZS5DdXN0b21lcjtcclxuICAgICAgICAgICAgaWYgKHApXHJcbiAgICAgICAgICAgICAgICB1c2VyVHlwZSA9IHVzZXJUeXBlIHwgVXNlclR5cGUuRnJlZWxhbmNlcjtcclxuICAgICAgICAgICAgaWYgKGEpXHJcbiAgICAgICAgICAgICAgICB1c2VyVHlwZSA9IHVzZXJUeXBlIHwgVXNlclR5cGUuQWRtaW47XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gdXNlclR5cGU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKiBOT1RFOiBOb3QgcmVxdWlyZWQgZm9yIG5vdzpcclxuICAgICAgICB3cml0ZTogZnVuY3Rpb24odikge1xyXG4gICAgICAgIH0sKi9cclxuICAgICAgICBvd25lcjogdGhpc1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMuaXNBbm9ueW1vdXMgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuICAgICAgICByZXR1cm4gdGhpcy51c2VySUQoKSA8IDE7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgSXQgbWF0Y2hlcyBhIFVzZXJUeXBlIGZyb20gdGhlIGVudW1lcmF0aW9uP1xyXG4gICAgKiovXHJcbiAgICB0aGlzLmlzVXNlclR5cGUgPSBmdW5jdGlvbiBpc1VzZXJUeXBlKHR5cGUpIHtcclxuICAgICAgICByZXR1cm4gKHRoaXMudXNlclR5cGUoKSAmIHR5cGUpO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFVzZXI7XHJcblxyXG5Vc2VyLlVzZXJUeXBlID0gVXNlclR5cGU7XHJcblxyXG4vKiBDcmVhdGludCBhbiBhbm9ueW1vdXMgdXNlciB3aXRoIHNvbWUgcHJlc3NldHMgKi9cclxuVXNlci5uZXdBbm9ueW1vdXMgPSBmdW5jdGlvbiBuZXdBbm9ueW1vdXMoKSB7XHJcbiAgICByZXR1cm4gbmV3IFVzZXIoe1xyXG4gICAgICAgIHVzZXJJRDogMCxcclxuICAgICAgICBlbWFpbDogJycsXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnJyxcclxuICAgICAgICBvbmJvYXJkaW5nU3RlcDogbnVsbFxyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgVXNlckpvYlRpdGxlIG1vZGVsLCByZWxhdGlvbnNoaXAgYmV0d2VlbiBhbiB1c2VyIGFuZCBhXHJcbiAgICBqb2IgdGl0bGUgYW5kIHRoZSBtYWluIGRhdGEgYXR0YWNoZWQgdG8gdGhhdCByZWxhdGlvbi5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIFVzZXJKb2JUaXRsZSh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgdXNlcklEOiAwLFxyXG4gICAgICAgIGpvYlRpdGxlSUQ6IDAsXHJcbiAgICAgICAgaW50cm86IG51bGwsXHJcbiAgICAgICAgc3RhdHVzSUQ6IDAsXHJcbiAgICAgICAgY2FuY2VsbGF0aW9uUG9saWN5SUQ6IDAsXHJcbiAgICAgICAgaW5zdGFudEJvb2tpbmc6IGZhbHNlLFxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBudWxsLFxyXG4gICAgICAgIHVwZGF0ZWREYXRlOiBudWxsXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZklEKFsndXNlcklEJywgJ2pvYlRpdGxlSUQnXSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVXNlckpvYlRpdGxlO1xyXG4iLCIvKiogQ2xpZW50cyB0ZXN0IGRhdGEgKiovXHJcbnZhciBDbGllbnQgPSByZXF1aXJlKCcuLi9tb2RlbHMvQ2xpZW50Jyk7XHJcblxyXG52YXIgdGVzdERhdGEgPSBbXHJcbiAgICBuZXcgQ2xpZW50ICh7XHJcbiAgICAgICAgaWQ6IDEsXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnSm9zaHVhJyxcclxuICAgICAgICBsYXN0TmFtZTogJ0RhbmllbHNvbidcclxuICAgIH0pLFxyXG4gICAgbmV3IENsaWVudCh7XHJcbiAgICAgICAgaWQ6IDIsXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnSWFnbycsXHJcbiAgICAgICAgbGFzdE5hbWU6ICdMb3JlbnpvJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBpZDogMyxcclxuICAgICAgICBmaXJzdE5hbWU6ICdGZXJuYW5kbycsXHJcbiAgICAgICAgbGFzdE5hbWU6ICdHYWdvJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBpZDogNCxcclxuICAgICAgICBmaXJzdE5hbWU6ICdBZGFtJyxcclxuICAgICAgICBsYXN0TmFtZTogJ0ZpbmNoJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBpZDogNSxcclxuICAgICAgICBmaXJzdE5hbWU6ICdBbGFuJyxcclxuICAgICAgICBsYXN0TmFtZTogJ0Zlcmd1c29uJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBpZDogNixcclxuICAgICAgICBmaXJzdE5hbWU6ICdBbGV4JyxcclxuICAgICAgICBsYXN0TmFtZTogJ1BlbmEnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiA3LFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FsZXhpcycsXHJcbiAgICAgICAgbGFzdE5hbWU6ICdQZWFjYSdcclxuICAgIH0pLFxyXG4gICAgbmV3IENsaWVudCh7XHJcbiAgICAgICAgaWQ6IDgsXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnQXJ0aHVyJyxcclxuICAgICAgICBsYXN0TmFtZTogJ01pbGxlcidcclxuICAgIH0pXHJcbl07XHJcblxyXG5leHBvcnRzLmNsaWVudHMgPSB0ZXN0RGF0YTtcclxuIiwiLyoqIExvY2F0aW9ucyB0ZXN0IGRhdGEgKiovXHJcbnZhciBMb2NhdGlvbiA9IHJlcXVpcmUoJy4uL21vZGVscy9Mb2NhdGlvbicpO1xyXG5cclxudmFyIHRlc3REYXRhID0gW1xyXG4gICAgbmV3IExvY2F0aW9uICh7XHJcbiAgICAgICAgbG9jYXRpb25JRDogMSxcclxuICAgICAgICBuYW1lOiAnQWN0dmlTcGFjZScsXHJcbiAgICAgICAgYWRkcmVzc0xpbmUxOiAnMzE1MCAxOHRoIFN0cmVldCcsXHJcbiAgICAgICAgcG9zdGFsQ29kZTogOTAwMDEsXHJcbiAgICAgICAgaXNTZXJ2aWNlUmFkaXVzOiB0cnVlLFxyXG4gICAgICAgIHNlcnZpY2VSYWRpdXM6IDJcclxuICAgIH0pLFxyXG4gICAgbmV3IExvY2F0aW9uKHtcclxuICAgICAgICBsb2NhdGlvbklEOiAyLFxyXG4gICAgICAgIG5hbWU6ICdDb3JleVxcJ3MgQXB0JyxcclxuICAgICAgICBhZGRyZXNzTGluZTE6ICcxODcgQm9jYW5hIFN0LicsXHJcbiAgICAgICAgcG9zdGFsQ29kZTogOTAwMDJcclxuICAgIH0pLFxyXG4gICAgbmV3IExvY2F0aW9uKHtcclxuICAgICAgICBsb2NhdGlvbklEOiAzLFxyXG4gICAgICAgIG5hbWU6ICdKb3NoXFwnYSBBcHQnLFxyXG4gICAgICAgIGFkZHJlc3NMaW5lMTogJzQyOSBDb3JiZXR0IEF2ZScsXHJcbiAgICAgICAgcG9zdGFsQ29kZTogOTAwMDNcclxuICAgIH0pXHJcbl07XHJcblxyXG5leHBvcnRzLmxvY2F0aW9ucyA9IHRlc3REYXRhO1xyXG4iLCIvKiogSW5ib3ggdGVzdCBkYXRhICoqL1xyXG52YXIgTWVzc2FnZSA9IHJlcXVpcmUoJy4uL21vZGVscy9NZXNzYWdlJyk7XHJcblxyXG52YXIgVGltZSA9IHJlcXVpcmUoJy4uL3V0aWxzL1RpbWUnKTtcclxuLy92YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG52YXIgdG9kYXkgPSBuZXcgRGF0ZSgpLFxyXG4gICAgeWVzdGVyZGF5ID0gbmV3IERhdGUoKSxcclxuICAgIGxhc3RXZWVrID0gbmV3IERhdGUoKSxcclxuICAgIG9sZERhdGUgPSBuZXcgRGF0ZSgpO1xyXG55ZXN0ZXJkYXkuc2V0RGF0ZSh5ZXN0ZXJkYXkuZ2V0RGF0ZSgpIC0gMSk7XHJcbmxhc3RXZWVrLnNldERhdGUobGFzdFdlZWsuZ2V0RGF0ZSgpIC0gMik7XHJcbm9sZERhdGUuc2V0RGF0ZShvbGREYXRlLmdldERhdGUoKSAtIDE2KTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IFtcclxuICAgIG5ldyBNZXNzYWdlKHtcclxuICAgICAgICBpZDogMSxcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbmV3IFRpbWUodG9kYXksIDExLCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnQ09ORklSTS1TdXNhbiBEZWUnLFxyXG4gICAgICAgIGNvbnRlbnQ6ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBsaW5rOiAnL2NvbnZlcnNhdGlvbi8xJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiAnJDcwJyxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy13YXJuaW5nJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgTWVzc2FnZSh7XHJcbiAgICAgICAgaWQ6IDMsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG5ldyBUaW1lKHllc3RlcmRheSwgMTMsIDAsIDApLFxyXG5cclxuICAgICAgICBzdWJqZWN0OiAnRG8geW91IGRvIFwiRXhvdGljIE1hc3NhZ2VcIj8nLFxyXG4gICAgICAgIGNvbnRlbnQ6ICdIaSwgSSB3YW50ZWQgdG8ga25vdyBpZiB5b3UgcGVyZm9ybSBhcyBwYXIgb2YgeW91ciBzZXJ2aWNlcy4uLicsXHJcbiAgICAgICAgbGluazogJy9jb252ZXJzYXRpb24vMycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXNoYXJlLWFsdCcsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgTWVzc2FnZSh7XHJcbiAgICAgICAgaWQ6IDIsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG5ldyBUaW1lKGxhc3RXZWVrLCAxMiwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0pvc2ggRGFuaWVsc29uJyxcclxuICAgICAgICBjb250ZW50OiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgbGluazogJy9jb252ZXJzYXRpb24vMicsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IE1lc3NhZ2Uoe1xyXG4gICAgICAgIGlkOiA0LFxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBuZXcgVGltZShvbGREYXRlLCAxNSwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0lucXVpcnknLFxyXG4gICAgICAgIGNvbnRlbnQ6ICdBbm90aGVyIHF1ZXN0aW9uIGZyb20gYW5vdGhlciBjbGllbnQuJyxcclxuICAgICAgICBsaW5rOiAnL2NvbnZlcnNhdGlvbi80JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tc2hhcmUtYWx0JyxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMubWVzc2FnZXMgPSB0ZXN0RGF0YTtcclxuIiwiLyoqIFNlcnZpY2VzIHRlc3QgZGF0YSAqKi9cclxudmFyIFNlcnZpY2UgPSByZXF1aXJlKCcuLi9tb2RlbHMvU2VydmljZScpO1xyXG5cclxudmFyIHRlc3REYXRhID0gW1xyXG4gICAgbmV3IFNlcnZpY2UgKHtcclxuICAgICAgICBuYW1lOiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgcHJpY2U6IDk1LFxyXG4gICAgICAgIGR1cmF0aW9uOiAxMjBcclxuICAgIH0pLFxyXG4gICAgbmV3IFNlcnZpY2Uoe1xyXG4gICAgICAgIG5hbWU6ICdUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgcHJpY2U6IDYwLFxyXG4gICAgICAgIGR1cmF0aW9uOiA2MFxyXG4gICAgfSksXHJcbiAgICBuZXcgU2VydmljZSh7XHJcbiAgICAgICAgbmFtZTogJ1NwZWNpYWwgb2lscycsXHJcbiAgICAgICAgcHJpY2U6IDk1LFxyXG4gICAgICAgIGlzQWRkb246IHRydWVcclxuICAgIH0pLFxyXG4gICAgbmV3IFNlcnZpY2Uoe1xyXG4gICAgICAgIG5hbWU6ICdTb21lIHNlcnZpY2UgZXh0cmEnLFxyXG4gICAgICAgIHByaWNlOiA0MCxcclxuICAgICAgICBkdXJhdGlvbjogMjAsXHJcbiAgICAgICAgaXNBZGRvbjogdHJ1ZVxyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMuc2VydmljZXMgPSB0ZXN0RGF0YTtcclxuIiwiLyoqIFxyXG4gICAgdGltZVNsb3RzXHJcbiAgICB0ZXN0aW5nIGRhdGFcclxuKiovXHJcblxyXG52YXIgVGltZSA9IHJlcXVpcmUoJy4uL3V0aWxzL1RpbWUnKTtcclxuXHJcbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbnZhciB0b2RheSA9IG5ldyBEYXRlKCksXHJcbiAgICB0b21vcnJvdyA9IG5ldyBEYXRlKCk7XHJcbnRvbW9ycm93LnNldERhdGUodG9tb3Jyb3cuZ2V0RGF0ZSgpICsgMSk7XHJcblxyXG52YXIgc3RvZGF5ID0gbW9tZW50KHRvZGF5KS5mb3JtYXQoJ1lZWVktTU0tREQnKSxcclxuICAgIHN0b21vcnJvdyA9IG1vbWVudCh0b21vcnJvdykuZm9ybWF0KCdZWVlZLU1NLUREJyk7XHJcblxyXG52YXIgdGVzdERhdGExID0gW1xyXG4gICAgVGltZSh0b2RheSwgOSwgMTUpLFxyXG4gICAgVGltZSh0b2RheSwgMTEsIDMwKSxcclxuICAgIFRpbWUodG9kYXksIDEyLCAwKSxcclxuICAgIFRpbWUodG9kYXksIDEyLCAzMCksXHJcbiAgICBUaW1lKHRvZGF5LCAxNiwgMTUpLFxyXG4gICAgVGltZSh0b2RheSwgMTgsIDApLFxyXG4gICAgVGltZSh0b2RheSwgMTgsIDMwKSxcclxuICAgIFRpbWUodG9kYXksIDE5LCAwKSxcclxuICAgIFRpbWUodG9kYXksIDE5LCAzMCksXHJcbiAgICBUaW1lKHRvZGF5LCAyMSwgMzApLFxyXG4gICAgVGltZSh0b2RheSwgMjIsIDApXHJcbl07XHJcblxyXG52YXIgdGVzdERhdGEyID0gW1xyXG4gICAgVGltZSh0b21vcnJvdywgOCwgMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMCwgMzApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTEsIDApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTEsIDMwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEyLCAwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEyLCAzMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMywgMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMywgMzApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTQsIDQ1KSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDE2LCAwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDE2LCAzMClcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YUJ1c3kgPSBbXHJcbl07XHJcblxyXG52YXIgdGVzdERhdGEgPSB7XHJcbiAgICAnZGVmYXVsdCc6IHRlc3REYXRhQnVzeVxyXG59O1xyXG50ZXN0RGF0YVtzdG9kYXldID0gdGVzdERhdGExO1xyXG50ZXN0RGF0YVtzdG9tb3Jyb3ddID0gdGVzdERhdGEyO1xyXG5cclxuZXhwb3J0cy50aW1lU2xvdHMgPSB0ZXN0RGF0YTtcclxuIiwiLyoqXHJcbiAgICBVdGlsaXR5IHRvIGhlbHAgdHJhY2sgdGhlIHN0YXRlIG9mIGNhY2hlZCBkYXRhXHJcbiAgICBtYW5hZ2luZyB0aW1lLCBwcmVmZXJlbmNlIGFuZCBpZiBtdXN0IGJlIHJldmFsaWRhdGVkXHJcbiAgICBvciBub3QuXHJcbiAgICBcclxuICAgIEl0cyBqdXN0IG1hbmFnZXMgbWV0YSBkYXRhLCBidXQgbm90IHRoZSBkYXRhIHRvIGJlIGNhY2hlZC5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbmZ1bmN0aW9uIENhY2hlQ29udHJvbChvcHRpb25zKSB7XHJcbiAgICBcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgIC8vIEEgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBvclxyXG4gICAgLy8gQW4gb2JqZWN0IHdpdGggZGVzaXJlZCB1bml0cyBhbmQgYW1vdW50LCBhbGwgb3B0aW9uYWwsXHJcbiAgICAvLyBhbnkgY29tYmluYXRpb24gd2l0aCBhbG1vc3Qgb25lIHNwZWNpZmllZCwgc2FtcGxlOlxyXG4gICAgLy8geyB5ZWFyczogMCwgbW9udGhzOiAwLCB3ZWVrczogMCwgXHJcbiAgICAvLyAgIGRheXM6IDAsIGhvdXJzOiAwLCBtaW51dGVzOiAwLCBzZWNvbmRzOiAwLCBtaWxsaXNlY29uZHM6IDAgfVxyXG4gICAgdGhpcy50dGwgPSBtb21lbnQuZHVyYXRpb24ob3B0aW9ucy50dGwpLmFzTWlsbGlzZWNvbmRzKCk7XHJcbiAgICB0aGlzLmxhdGVzdCA9IG9wdGlvbnMubGF0ZXN0IHx8IG51bGw7XHJcblxyXG4gICAgdGhpcy5tdXN0UmV2YWxpZGF0ZSA9IGZ1bmN0aW9uIG11c3RSZXZhbGlkYXRlKCkge1xyXG4gICAgICAgIHZhciB0ZGlmZiA9IHRoaXMubGF0ZXN0ICYmIG5ldyBEYXRlKCkgLSB0aGlzLmxhdGVzdCB8fCBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XHJcbiAgICAgICAgcmV0dXJuIHRkaWZmID4gdGhpcy50dGw7XHJcbiAgICB9O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENhY2hlQ29udHJvbDtcclxuIiwiLyoqXHJcbiAgICBOZXcgRnVuY3Rpb24gbWV0aG9kOiAnX2RlbGF5ZWQnLlxyXG4gICAgSXQgcmV0dXJucyBhIG5ldyBmdW5jdGlvbiwgd3JhcHBpbmcgdGhlIG9yaWdpbmFsIG9uZSxcclxuICAgIHRoYXQgb25jZSBpdHMgY2FsbCB3aWxsIGRlbGF5IHRoZSBleGVjdXRpb24gdGhlIGdpdmVuIG1pbGxpc2Vjb25kcyxcclxuICAgIHVzaW5nIGEgc2V0VGltZW91dC5cclxuICAgIFRoZSBuZXcgZnVuY3Rpb24gcmV0dXJucyAndW5kZWZpbmVkJyBzaW5jZSBpdCBoYXMgbm90IHRoZSByZXN1bHQsXHJcbiAgICBiZWNhdXNlIG9mIHRoYXQgaXMgb25seSBzdWl0YWJsZSB3aXRoIHJldHVybi1mcmVlIGZ1bmN0aW9ucyBcclxuICAgIGxpa2UgZXZlbnQgaGFuZGxlcnMuXHJcbiAgICBcclxuICAgIFdoeTogc29tZXRpbWVzLCB0aGUgaGFuZGxlciBmb3IgYW4gZXZlbnQgbmVlZHMgdG8gYmUgZXhlY3V0ZWRcclxuICAgIGFmdGVyIGEgZGVsYXkgaW5zdGVhZCBvZiBpbnN0YW50bHkuXHJcbioqL1xyXG5GdW5jdGlvbi5wcm90b3R5cGUuX2RlbGF5ZWQgPSBmdW5jdGlvbiBkZWxheWVkKG1pbGxpc2Vjb25kcykge1xyXG4gICAgdmFyIGZuID0gdGhpcztcclxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgY29udGV4dCA9IHRoaXMsXHJcbiAgICAgICAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZuLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xyXG4gICAgICAgIH0sIG1pbGxpc2Vjb25kcyk7XHJcbiAgICB9O1xyXG59O1xyXG4iLCIvKipcclxuICAgIEV4dGVuZGluZyB0aGUgRnVuY3Rpb24gY2xhc3Mgd2l0aCBhbiBpbmhlcml0cyBtZXRob2QuXHJcbiAgICBcclxuICAgIFRoZSBpbml0aWFsIGxvdyBkYXNoIGlzIHRvIG1hcmsgaXQgYXMgbm8tc3RhbmRhcmQuXHJcbioqL1xyXG5GdW5jdGlvbi5wcm90b3R5cGUuX2luaGVyaXRzID0gZnVuY3Rpb24gX2luaGVyaXRzKHN1cGVyQ3Rvcikge1xyXG4gICAgdGhpcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcjoge1xyXG4gICAgICAgICAgICB2YWx1ZTogdGhpcyxcclxuICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBVdGlsaXR5IHRoYXQgYWxsb3dzIHRvIGtlZXAgYW4gb3JpZ2luYWwgbW9kZWwgdW50b3VjaGVkXHJcbiAgICB3aGlsZSBlZGl0aW5nIGEgdmVyc2lvbiwgaGVscGluZyBzeW5jaHJvbml6ZSBib3RoXHJcbiAgICB3aGVuIGRlc2lyZWQgYnkgcHVzaC9wdWxsL3N5bmMtaW5nLlxyXG4gICAgXHJcbiAgICBJdHMgdGhlIHVzdWFsIHdheSB0byB3b3JrIG9uIGZvcm1zLCB3aGVyZSBhbiBpbiBtZW1vcnlcclxuICAgIG1vZGVsIGNhbiBiZSB1c2VkIGJ1dCBpbiBhIGNvcHkgc28gY2hhbmdlcyBkb2Vzbid0IGFmZmVjdHNcclxuICAgIG90aGVyIHVzZXMgb2YgdGhlIGluLW1lbW9yeSBtb2RlbCAoYW5kIGF2b2lkcyByZW1vdGUgc3luY2luZylcclxuICAgIHVudGlsIHRoZSBjb3B5IHdhbnQgdG8gYmUgcGVyc2lzdGVkIGJ5IHB1c2hpbmcgaXQsIG9yIGJlaW5nXHJcbiAgICBkaXNjYXJkZWQgb3IgcmVmcmVzaGVkIHdpdGggYSByZW1vdGVseSB1cGRhdGVkIG9yaWdpbmFsIG1vZGVsLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcclxuXHJcbmZ1bmN0aW9uIE1vZGVsVmVyc2lvbihvcmlnaW5hbCkge1xyXG4gICAgXHJcbiAgICBFdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5vcmlnaW5hbCA9IG9yaWdpbmFsO1xyXG4gICAgXHJcbiAgICAvLyBDcmVhdGUgdmVyc2lvblxyXG4gICAgLy8gKHVwZGF0ZVdpdGggdGFrZXMgY2FyZSB0byBzZXQgdGhlIHNhbWUgZGF0YVRpbWVzdGFtcClcclxuICAgIHRoaXMudmVyc2lvbiA9IG9yaWdpbmFsLm1vZGVsLmNsb25lKCk7XHJcbiAgICBcclxuICAgIC8vIENvbXB1dGVkIHRoYXQgdGVzdCBlcXVhbGl0eSwgYWxsb3dpbmcgYmVpbmcgbm90aWZpZWQgb2YgY2hhbmdlc1xyXG4gICAgLy8gQSByYXRlTGltaXQgaXMgdXNlZCBvbiBlYWNoIHRvIGF2b2lkIHNldmVyYWwgc3luY3Job25vdXMgbm90aWZpY2F0aW9ucy5cclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgUmV0dXJucyB0cnVlIHdoZW4gYm90aCB2ZXJzaW9ucyBoYXMgdGhlIHNhbWUgdGltZXN0YW1wXHJcbiAgICAqKi9cclxuICAgIHRoaXMuYXJlRGlmZmVyZW50ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uIGFyZURpZmZlcmVudCgpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLm9yaWdpbmFsLm1vZGVsLmRhdGFUaW1lc3RhbXAoKSAhPT0gXHJcbiAgICAgICAgICAgIHRoaXMudmVyc2lvbi5tb2RlbC5kYXRhVGltZXN0YW1wKClcclxuICAgICAgICApO1xyXG4gICAgfSwgdGhpcykuZXh0ZW5kKHsgcmF0ZUxpbWl0OiAwIH0pO1xyXG4gICAgLyoqXHJcbiAgICAgICAgUmV0dXJucyB0cnVlIHdoZW4gdGhlIHZlcnNpb24gaGFzIG5ld2VyIGNoYW5nZXMgdGhhblxyXG4gICAgICAgIHRoZSBvcmlnaW5hbFxyXG4gICAgKiovXHJcbiAgICB0aGlzLmlzTmV3ZXIgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24gaXNOZXdlcigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLm9yaWdpbmFsLm1vZGVsLmRhdGFUaW1lc3RhbXAoKSA8IFxyXG4gICAgICAgICAgICB0aGlzLnZlcnNpb24ubW9kZWwuZGF0YVRpbWVzdGFtcCgpXHJcbiAgICAgICAgKTtcclxuICAgIH0sIHRoaXMpLmV4dGVuZCh7IHJhdGVMaW1pdDogMCB9KTtcclxuICAgIC8qKlxyXG4gICAgICAgIFJldHVybnMgdHJ1ZSB3aGVuIHRoZSB2ZXJzaW9uIGhhcyBvbGRlciBjaGFuZ2VzIHRoYW5cclxuICAgICAgICB0aGUgb3JpZ2luYWxcclxuICAgICoqL1xyXG4gICAgdGhpcy5pc09ic29sZXRlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uIGlzQ29tcHV0ZWQoKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5vcmlnaW5hbC5tb2RlbC5kYXRhVGltZXN0YW1wKCkgPiBcclxuICAgICAgICAgICAgdGhpcy52ZXJzaW9uLm1vZGVsLmRhdGFUaW1lc3RhbXAoKVxyXG4gICAgICAgICk7XHJcbiAgICB9LCB0aGlzKS5leHRlbmQoeyByYXRlTGltaXQ6IDAgfSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTW9kZWxWZXJzaW9uO1xyXG5cclxuTW9kZWxWZXJzaW9uLl9pbmhlcml0cyhFdmVudEVtaXR0ZXIpO1xyXG5cclxuLyoqXHJcbiAgICBTZW5kcyB0aGUgdmVyc2lvbiBjaGFuZ2VzIHRvIHRoZSBvcmlnaW5hbFxyXG4gICAgXHJcbiAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgZXZlbklmTmV3ZXI6IGZhbHNlXHJcbiAgICB9XHJcbioqL1xyXG5Nb2RlbFZlcnNpb24ucHJvdG90eXBlLnB1bGwgPSBmdW5jdGlvbiBwdWxsKG9wdGlvbnMpIHtcclxuXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIFxyXG4gICAgLy8gQnkgZGVmYXVsdCwgbm90aGluZyB0byBkbywgb3IgYXZvaWQgb3ZlcndyaXRlIGNoYW5nZXMuXHJcbiAgICB2YXIgcmVzdWx0ID0gZmFsc2UsXHJcbiAgICAgICAgcm9sbGJhY2sgPSBudWxsO1xyXG4gICAgXHJcbiAgICBpZiAob3B0aW9ucy5ldmVuSWZOZXdlciB8fCAhdGhpcy5pc05ld2VyKCkpIHtcclxuICAgICAgICAvLyBVcGRhdGUgdmVyc2lvbiB3aXRoIHRoZSBvcmlnaW5hbCBkYXRhLFxyXG4gICAgICAgIC8vIGNyZWF0aW5nIGZpcnN0IGEgcm9sbGJhY2sgZnVuY3Rpb24uXHJcbiAgICAgICAgcm9sbGJhY2sgPSBjcmVhdGVSb2xsYmFja0Z1bmN0aW9uKHRoaXMudmVyc2lvbik7XHJcbiAgICAgICAgLy8gRXZlciBkZWVwQ29weSwgc2luY2Ugb25seSBwcm9wZXJ0aWVzIGFuZCBmaWVsZHMgZnJvbSBtb2RlbHNcclxuICAgICAgICAvLyBhcmUgY29waWVkIGFuZCB0aGF0IG11c3QgYXZvaWQgY2lyY3VsYXIgcmVmZXJlbmNlc1xyXG4gICAgICAgIC8vIFRoZSBtZXRob2QgdXBkYXRlV2l0aCB0YWtlcyBjYXJlIHRvIHNldCB0aGUgc2FtZSBkYXRhVGltZXN0YW1wOiAgICAgICAgXHJcbiAgICAgICAgdGhpcy52ZXJzaW9uLm1vZGVsLnVwZGF0ZVdpdGgodGhpcy5vcmlnaW5hbCwgdHJ1ZSk7XHJcbiAgICAgICAgLy8gRG9uZVxyXG4gICAgICAgIHJlc3VsdCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5lbWl0KCdwdWxsJywgcmVzdWx0LCByb2xsYmFjayk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBEaXNjYXJkIHRoZSB2ZXJzaW9uIGNoYW5nZXMgZ2V0dGluZyB0aGUgb3JpZ2luYWxcclxuICAgIGRhdGEuXHJcbiAgICBcclxuICAgIG9wdGlvbnM6IHtcclxuICAgICAgICBldmVuSWZPYnNvbGV0ZTogZmFsc2VcclxuICAgIH1cclxuKiovXHJcbk1vZGVsVmVyc2lvbi5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uIHB1c2gob3B0aW9ucykge1xyXG4gICAgXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIFxyXG4gICAgLy8gQnkgZGVmYXVsdCwgbm90aGluZyB0byBkbywgb3IgYXZvaWQgb3ZlcndyaXRlIGNoYW5nZXMuXHJcbiAgICB2YXIgcmVzdWx0ID0gZmFsc2UsXHJcbiAgICAgICAgcm9sbGJhY2sgPSBudWxsO1xyXG5cclxuICAgIGlmIChvcHRpb25zLmV2ZW5JZk9ic29sZXRlIHx8ICF0aGlzLmlzT2Jzb2xldGUoKSkge1xyXG4gICAgICAgIC8vIFVwZGF0ZSBvcmlnaW5hbCwgY3JlYXRpbmcgZmlyc3QgYSByb2xsYmFjayBmdW5jdGlvbi5cclxuICAgICAgICByb2xsYmFjayA9IGNyZWF0ZVJvbGxiYWNrRnVuY3Rpb24odGhpcy5vcmlnaW5hbCk7XHJcbiAgICAgICAgLy8gRXZlciBkZWVwQ29weSwgc2luY2Ugb25seSBwcm9wZXJ0aWVzIGFuZCBmaWVsZHMgZnJvbSBtb2RlbHNcclxuICAgICAgICAvLyBhcmUgY29waWVkIGFuZCB0aGF0IG11c3QgYXZvaWQgY2lyY3VsYXIgcmVmZXJlbmNlc1xyXG4gICAgICAgIC8vIFRoZSBtZXRob2QgdXBkYXRlV2l0aCB0YWtlcyBjYXJlIHRvIHNldCB0aGUgc2FtZSBkYXRhVGltZXN0YW1wLlxyXG4gICAgICAgIHRoaXMub3JpZ2luYWwubW9kZWwudXBkYXRlV2l0aCh0aGlzLnZlcnNpb24sIHRydWUpO1xyXG4gICAgICAgIC8vIERvbmVcclxuICAgICAgICByZXN1bHQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZW1pdCgncHVzaCcsIHJlc3VsdCwgcm9sbGJhY2spO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgU2V0cyBvcmlnaW5hbCBhbmQgdmVyc2lvbiBvbiB0aGUgc2FtZSB2ZXJzaW9uXHJcbiAgICBieSBnZXR0aW5nIHRoZSBuZXdlc3Qgb25lLlxyXG4qKi9cclxuTW9kZWxWZXJzaW9uLnByb3RvdHlwZS5zeW5jID0gZnVuY3Rpb24gc3luYygpIHtcclxuICAgIFxyXG4gICAgaWYgKHRoaXMuaXNOZXdlcigpKVxyXG4gICAgICAgIHJldHVybiB0aGlzLnB1c2goKTtcclxuICAgIGVsc2UgaWYgKHRoaXMuaXNPYnNvbGV0ZSgpKVxyXG4gICAgICAgIHJldHVybiB0aGlzLnB1bGwoKTtcclxuICAgIGVsc2VcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbn07XHJcblxyXG4vKipcclxuICAgIFV0aWxpdHkgdGhhdCBjcmVhdGUgYSBmdW5jdGlvbiBhYmxlIHRvIFxyXG4gICAgcGVyZm9ybSBhIGRhdGEgcm9sbGJhY2sgb24gZXhlY3V0aW9uLCB1c2VmdWxcclxuICAgIHRvIHBhc3Mgb24gdGhlIGV2ZW50cyB0byBhbGxvdyByZWFjdCB1cG9uIGNoYW5nZXNcclxuICAgIG9yIGV4dGVybmFsIHN5bmNocm9uaXphdGlvbiBmYWlsdXJlcy5cclxuKiovXHJcbmZ1bmN0aW9uIGNyZWF0ZVJvbGxiYWNrRnVuY3Rpb24obW9kZWxJbnN0YW5jZSkge1xyXG4gICAgLy8gUHJldmlvdXMgZnVuY3Rpb24gY3JlYXRpb24sIGdldCBOT1cgdGhlIGluZm9ybWF0aW9uIHRvXHJcbiAgICAvLyBiZSBiYWNrZWQgZm9yIGxhdGVyLlxyXG4gICAgdmFyIGJhY2tlZERhdGEgPSBtb2RlbEluc3RhbmNlLm1vZGVsLnRvUGxhaW5PYmplY3QodHJ1ZSksXHJcbiAgICAgICAgYmFja2VkVGltZXN0YW1wID0gbW9kZWxJbnN0YW5jZS5tb2RlbC5kYXRhVGltZXN0YW1wKCk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIHRoZSBmdW5jdGlvbiB0aGF0ICptYXkqIGdldCBleGVjdXRlZCBsYXRlciwgYWZ0ZXJcclxuICAgIC8vIGNoYW5nZXMgd2VyZSBkb25lIGluIHRoZSBtb2RlbEluc3RhbmNlLlxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIHJvbGxiYWNrKCkge1xyXG4gICAgICAgIC8vIFNldCB0aGUgYmFja2VkIGRhdGFcclxuICAgICAgICBtb2RlbEluc3RhbmNlLm1vZGVsLnVwZGF0ZVdpdGgoYmFja2VkRGF0YSk7XHJcbiAgICAgICAgLy8gQW5kIHRoZSB0aW1lc3RhbXBcclxuICAgICAgICBtb2RlbEluc3RhbmNlLm1vZGVsLmRhdGFUaW1lc3RhbXAoYmFja2VkVGltZXN0YW1wKTtcclxuICAgIH07XHJcbn1cclxuIiwiLyoqXHJcbiAgICBSZW1vdGVNb2RlbCBjbGFzcy5cclxuICAgIFxyXG4gICAgSXQgaGVscHMgbWFuYWdpbmcgYSBtb2RlbCBpbnN0YW5jZSwgbW9kZWwgdmVyc2lvbnNcclxuICAgIGZvciBpbiBtZW1vcnkgbW9kaWZpY2F0aW9uLCBhbmQgdGhlIHByb2Nlc3MgdG8gXHJcbiAgICByZWNlaXZlIG9yIHNlbmQgdGhlIG1vZGVsIGRhdGFcclxuICAgIHRvIGEgcmVtb3RlIHNvdXJjZXMsIHdpdGggZ2x1ZSBjb2RlIGZvciB0aGUgdGFza3NcclxuICAgIGFuZCBzdGF0ZSBwcm9wZXJ0aWVzLlxyXG4gICAgXHJcbiAgICBFdmVyeSBpbnN0YW5jZSBvciBzdWJjbGFzcyBtdXN0IGltcGxlbWVudFxyXG4gICAgdGhlIGZldGNoIGFuZCBwdWxsIG1ldGhvZHMgdGhhdCBrbm93cyB0aGUgc3BlY2lmaWNzXHJcbiAgICBvZiB0aGUgcmVtb3Rlcy5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBNb2RlbFZlcnNpb24gPSByZXF1aXJlKCcuLi91dGlscy9Nb2RlbFZlcnNpb24nKSxcclxuICAgIENhY2hlQ29udHJvbCA9IHJlcXVpcmUoJy4uL3V0aWxzL0NhY2hlQ29udHJvbCcpLFxyXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgbG9jYWxmb3JhZ2UgPSByZXF1aXJlKCdsb2NhbGZvcmFnZScpLFxyXG4gICAgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xyXG5cclxuZnVuY3Rpb24gUmVtb3RlTW9kZWwob3B0aW9ucykge1xyXG5cclxuICAgIEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xyXG4gICAgXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIFxyXG4gICAgdmFyIGZpcnN0VGltZUxvYWQgPSB0cnVlO1xyXG4gICAgXHJcbiAgICAvLyBNYXJrcyBhIGxvY2sgbG9hZGluZyBpcyBoYXBwZW5pbmcsIGFueSB1c2VyIGNvZGVcclxuICAgIC8vIG11c3Qgd2FpdCBmb3IgaXRcclxuICAgIHRoaXMuaXNMb2FkaW5nID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcbiAgICAvLyBNYXJrcyBhIGxvY2sgc2F2aW5nIGlzIGhhcHBlbmluZywgYW55IHVzZXIgY29kZVxyXG4gICAgLy8gbXVzdCB3YWl0IGZvciBpdFxyXG4gICAgdGhpcy5pc1NhdmluZyA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgLy8gTWFya3MgYSBiYWNrZ3JvdW5kIHN5bmNocm9uaXphdGlvbjogbG9hZCBvciBzYXZlLFxyXG4gICAgLy8gdXNlciBjb2RlIGtub3dzIGlzIGhhcHBlbmluZyBidXQgY2FuIGNvbnRpbnVlXHJcbiAgICAvLyB1c2luZyBjYWNoZWQgZGF0YVxyXG4gICAgdGhpcy5pc1N5bmNpbmcgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuICAgIC8vIFV0aWxpdHkgdG8ga25vdyB3aGV0aGVyIGFueSBsb2NraW5nIG9wZXJhdGlvbiBpc1xyXG4gICAgLy8gaGFwcGVuaW5nLlxyXG4gICAgLy8gSnVzdCBsb2FkaW5nIG9yIHNhdmluZ1xyXG4gICAgdGhpcy5pc0xvY2tlZCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmlzTG9hZGluZygpIHx8IHRoaXMuaXNTYXZpbmcoKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICBpZiAoIW9wdGlvbnMuZGF0YSlcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlbW90ZU1vZGVsIGRhdGEgbXVzdCBiZSBzZXQgb24gY29uc3RydWN0b3IgYW5kIG5vIGNoYW5nZWQgbGF0ZXInKTtcclxuICAgIHRoaXMuZGF0YSA9IG9wdGlvbnMuZGF0YTtcclxuICAgIFxyXG4gICAgdGhpcy5jYWNoZSA9IG5ldyBDYWNoZUNvbnRyb2woe1xyXG4gICAgICAgIHR0bDogb3B0aW9ucy50dGxcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBPcHRpb25hbCBuYW1lIHVzZWQgdG8gcGVyc2lzdCBhIGNvcHkgb2YgdGhlIGRhdGEgYXMgcGxhaW4gb2JqZWN0XHJcbiAgICAvLyBpbiB0aGUgbG9jYWwgc3RvcmFnZSBvbiBldmVyeSBzdWNjZXNzZnVsbHkgbG9hZC9zYXZlIG9wZXJhdGlvbi5cclxuICAgIC8vIFdpdGggbm8gbmFtZSwgbm8gc2F2ZWQgKGRlZmF1bHQpLlxyXG4gICAgLy8gSXQgdXNlcyAnbG9jYWxmb3JhZ2UnLCBzbyBtYXkgYmUgbm90IHNhdmVkIHVzaW5nIGxvY2FsU3RvcmFnZSBhY3R1YWxseSxcclxuICAgIC8vIGJ1dCBhbnkgc3VwcG9ydGVkIGFuZCBpbml0aWFsaXplZCBzdG9yYWdlIHN5c3RlbSwgbGlrZSBXZWJTUUwsIEluZGV4ZWREQiBvciBMb2NhbFN0b3JhZ2UuXHJcbiAgICAvLyBsb2NhbGZvcmFnZSBtdXN0IGhhdmUgYSBzZXQtdXAgcHJldmlvdXMgdXNlIG9mIHRoaXMgb3B0aW9uLlxyXG4gICAgdGhpcy5sb2NhbFN0b3JhZ2VOYW1lID0gb3B0aW9ucy5sb2NhbFN0b3JhZ2VOYW1lIHx8IG51bGw7XHJcbiAgICBcclxuICAgIC8vIFJlY29tbWVuZGVkIHdheSB0byBnZXQgdGhlIGluc3RhbmNlIGRhdGFcclxuICAgIC8vIHNpbmNlIGl0IGVuc3VyZXMgdG8gbGF1bmNoIGEgbG9hZCBvZiB0aGVcclxuICAgIC8vIGRhdGEgZWFjaCB0aW1lIGlzIGFjY2Vzc2VkIHRoaXMgd2F5LlxyXG4gICAgdGhpcy5nZXREYXRhID0gZnVuY3Rpb24gZ2V0RGF0YSgpIHtcclxuICAgICAgICB0aGlzLmxvYWQoKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5kYXRhO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLm5ld1ZlcnNpb24gPSBmdW5jdGlvbiBuZXdWZXJzaW9uKCkge1xyXG4gICAgICAgIHZhciB2ID0gbmV3IE1vZGVsVmVyc2lvbih0aGlzLmRhdGEpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgdmVyc2lvbiBkYXRhIHdpdGggdGhlIG9yaWdpbmFsXHJcbiAgICAgICAgLy8gYWZ0ZXIgYSBsb2NrIGxvYWQgZmluaXNoLCBsaWtlIHRoZSBmaXJzdCB0aW1lLFxyXG4gICAgICAgIC8vIHNpbmNlIHRoZSBVSSB0byBlZGl0IHRoZSB2ZXJzaW9uIHdpbGwgYmUgbG9ja1xyXG4gICAgICAgIC8vIGluIHRoZSBtaWRkbGUuXHJcbiAgICAgICAgdGhpcy5pc0xvYWRpbmcuc3Vic2NyaWJlKGZ1bmN0aW9uIChpc0l0KSB7XHJcbiAgICAgICAgICAgIGlmICghaXNJdCkge1xyXG4gICAgICAgICAgICAgICAgdi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBTYXZlIHRoZSByZW1vdGUgd2hlbiBzdWNjZXNzZnVsbHkgcHVzaGVkIHRoZSBuZXcgdmVyc2lvblxyXG4gICAgICAgIHYub24oJ3B1c2gnLCBmdW5jdGlvbihzdWNjZXNzLCByb2xsYmFjaykge1xyXG4gICAgICAgICAgICBpZiAoc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zYXZlKClcclxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgdmVyc2lvbiBkYXRhIHdpdGggdGhlIG5ldyBvbmVcclxuICAgICAgICAgICAgICAgICAgICAvLyBmcm9tIHRoZSByZW1vdGUsIHRoYXQgbWF5IGluY2x1ZGUgcmVtb3RlIGNvbXB1dGVkXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdmFsdWVzOlxyXG4gICAgICAgICAgICAgICAgICAgIHYucHVsbCh7IGV2ZW5JZk5ld2VyOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBUbyBjYXRjaCB0aGUgZXJyb3IgaXMgaW1wb3J0YW50IFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIGF2b2lkICd1bmtub3cgZXJyb3IncyBmcm9tIGJlaW5nXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gbG9nZ2VkIG9uIHRoZSBjb25zb2xlLlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBlcnJvciBjYW4gYmUgcmVhZCBieSBsaXN0ZW5pbmcgdGhlICdlcnJvcicgZXZlbnQuXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUGVyZm9ybXMgYSByb2xsYmFjayBvZiB0aGUgb3JpZ2luYWwgbW9kZWxcclxuICAgICAgICAgICAgICAgICAgICByb2xsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSB2ZXJzaW9uIGRhdGEga2VlcHMgdW50b3VjaGVkLCB1c2VyIG1heSB3YW50IHRvIHJldHJ5XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gb3IgbWFkZSBjaGFuZ2VzIG9uIGl0cyB1bi1zYXZlZCBkYXRhLlxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICByZXR1cm4gdjtcclxuICAgIH07XHJcbiAgICBcclxuICAgIHRoaXMuZmV0Y2ggPSBvcHRpb25zLmZldGNoIHx8IGZ1bmN0aW9uIGZldGNoKCkgeyB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCcpOyB9O1xyXG4gICAgdGhpcy5wdXNoID0gb3B0aW9ucy5wdXNoIHx8IGZ1bmN0aW9uIHB1c2goKSB7IHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGQnKTsgfTtcclxuXHJcbiAgICB2YXIgbG9hZEZyb21SZW1vdGUgPSBmdW5jdGlvbiBsb2FkRnJvbVJlbW90ZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5mZXRjaCgpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHNlcnZlckRhdGEpIHtcclxuICAgICAgICAgICAgaWYgKHNlcnZlckRhdGEpIHtcclxuICAgICAgICAgICAgICAgIC8vIEV2ZXIgZGVlcENvcHksIHNpbmNlIHBsYWluIGRhdGEgZnJvbSB0aGUgc2VydmVyIChhbmQgYW55XHJcbiAgICAgICAgICAgICAgICAvLyBpbiBiZXR3ZWVuIGNvbnZlcnNpb24gb24gJ2ZlY3RoJykgY2Fubm90IGhhdmUgY2lyY3VsYXJcclxuICAgICAgICAgICAgICAgIC8vIHJlZmVyZW5jZXM6XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEubW9kZWwudXBkYXRlV2l0aChzZXJ2ZXJEYXRhLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBwZXJzaXN0ZW50IGxvY2FsIGNvcHk/XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sb2NhbFN0b3JhZ2VOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxmb3JhZ2Uuc2V0SXRlbSh0aGlzLmxvY2FsU3RvcmFnZU5hbWUsIHNlcnZlckRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZW1vdGUgbW9kZWwgZGlkIG5vdCByZXR1cm5lZCBkYXRhLCByZXNwb25zZSBtdXN0IGJlIGEgXCJOb3QgRm91bmRcIicpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBFdmVudFxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc0xvYWRpbmcoKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdsb2FkJywgc2VydmVyRGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3N5bmNlZCcsIHNlcnZlckRhdGEpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBGaW5hbGx5OiBjb21tb24gdGFza3Mgb24gc3VjY2VzcyBvciBlcnJvclxyXG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZyhmYWxzZSk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNTeW5jaW5nKGZhbHNlKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2FjaGUubGF0ZXN0ID0gbmV3IERhdGUoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF0YTtcclxuICAgICAgICB9LmJpbmQodGhpcykpXHJcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xyXG5cclxuICAgICAgICAgICAgdmFyIHdhc0xvYWQgPSB0aGlzLmlzTG9hZGluZygpO1xyXG5cclxuICAgICAgICAgICAgLy8gRmluYWxseTogY29tbW9uIHRhc2tzIG9uIHN1Y2Nlc3Mgb3IgZXJyb3JcclxuICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICB0aGlzLmlzU3luY2luZyhmYWxzZSk7XHJcblxyXG4gICAgICAgICAgICAvLyBFdmVudFxyXG4gICAgICAgICAgICB2YXIgZXJyUGtnID0ge1xyXG4gICAgICAgICAgICAgICAgdGFzazogd2FzTG9hZCA/ICdsb2FkJyA6ICdzeW5jJyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLy8gQmUgY2FyZWZ1bCB3aXRoICdlcnJvcicgZXZlbnQsIGlzIHNwZWNpYWwgYW5kIHN0b3BzIGV4ZWN1dGlvbiBvbiBlbWl0XHJcbiAgICAgICAgICAgIC8vIGlmIG5vIGxpc3RlbmVycyBhdHRhY2hlZDogb3ZlcndyaXR0aW5nIHRoYXQgYmVoYXZpb3IgYnkganVzdFxyXG4gICAgICAgICAgICAvLyBwcmludCBvbiBjb25zb2xlIHdoZW4gbm90aGluZywgb3IgZW1pdCBpZiBzb21lIGxpc3RlbmVyOlxyXG4gICAgICAgICAgICBpZiAoRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQodGhpcywgJ2Vycm9yJykgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyUGtnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIExvZyBpdCB3aGVuIG5vdCBoYW5kbGVkIChldmVuIGlmIHRoZSBwcm9taXNlIGVycm9yIGlzIGhhbmRsZWQpXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdSZW1vdGVNb2RlbCBFcnJvcicsIGVyclBrZyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFJldGhyb3cgZXJyb3JcclxuICAgICAgICAgICAgcmV0dXJuIGVycjtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmxvYWQgPSBmdW5jdGlvbiBsb2FkKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmNhY2hlLm11c3RSZXZhbGlkYXRlKCkpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChmaXJzdFRpbWVMb2FkKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcodHJ1ZSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNTeW5jaW5nKHRydWUpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHByb21pc2UgPSBudWxsO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gSWYgbG9jYWwgc3RvcmFnZSBpcyBzZXQgZm9yIHRoaXMsIGxvYWQgZmlyc3RcclxuICAgICAgICAgICAgLy8gZnJvbSBsb2NhbCwgdGhlbiBmb2xsb3cgd2l0aCBzeW5jaW5nIGZyb20gcmVtb3RlXHJcbiAgICAgICAgICAgIGlmIChmaXJzdFRpbWVMb2FkICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmxvY2FsU3RvcmFnZU5hbWUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBwcm9taXNlID0gbG9jYWxmb3JhZ2UuZ2V0SXRlbSh0aGlzLmxvY2FsU3RvcmFnZU5hbWUpXHJcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihsb2NhbERhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobG9jYWxEYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5tb2RlbC51cGRhdGVXaXRoKGxvY2FsRGF0YSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBMb2FkIGRvbmU6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pc1N5bmNpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTG9jYWwgbG9hZCBkb25lLCBkbyBhIGJhY2tncm91bmRcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3RlIGxvYWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZEZyb21SZW1vdGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8ganVzdCBkb24ndCB3YWl0LCByZXR1cm4gY3VycmVudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkYXRhXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXaGVuIG5vIGRhdGEsIHBlcmZvcm0gYSByZW1vdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbG9hZCBhbmQgd2FpdCBmb3IgaXQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBsb2FkRnJvbVJlbW90ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBQZXJmb3JtIHRoZSByZW1vdGUgbG9hZDpcclxuICAgICAgICAgICAgICAgIHByb21pc2UgPSBsb2FkRnJvbVJlbW90ZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBGaXJzdCB0aW1lLCBibG9ja2luZyBsb2FkOlxyXG4gICAgICAgICAgICAvLyBpdCByZXR1cm5zIHdoZW4gdGhlIGxvYWQgcmV0dXJuc1xyXG4gICAgICAgICAgICBpZiAoZmlyc3RUaW1lTG9hZCkge1xyXG4gICAgICAgICAgICAgICAgZmlyc3RUaW1lTG9hZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgLy8gUmV0dXJucyB0aGUgcHJvbWlzZSBhbmQgd2lsbCB3YWl0IGZvciB0aGUgZmlyc3QgbG9hZDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gQmFja2dyb3VuZCBsb2FkOiBpcyBsb2FkaW5nIHN0aWxsXHJcbiAgICAgICAgICAgICAgICAvLyBidXQgd2UgaGF2ZSBjYWNoZWQgZGF0YSBzbyB3ZSB1c2VcclxuICAgICAgICAgICAgICAgIC8vIHRoYXQgZm9yIG5vdy4gSWYgYW55dGhpbmcgbmV3IGZyb20gb3V0c2lkZVxyXG4gICAgICAgICAgICAgICAgLy8gdmVyc2lvbnMgd2lsbCBnZXQgbm90aWZpZWQgd2l0aCBpc09ic29sZXRlKClcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5kYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gUmV0dXJuIGNhY2hlZCBkYXRhLCBubyBuZWVkIHRvIGxvYWQgYWdhaW4gZm9yIG5vdy5cclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLmRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgICAgICB0aGlzLmlzU2F2aW5nKHRydWUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFByZXNlcnZlIHRoZSB0aW1lc3RhbXAgYWZ0ZXIgYmVpbmcgc2F2ZWRcclxuICAgICAgICAvLyB0byBhdm9pZCBmYWxzZSAnb2Jzb2xldGUnIHdhcm5pbmdzIHdpdGhcclxuICAgICAgICAvLyB0aGUgdmVyc2lvbiB0aGF0IGNyZWF0ZWQgdGhlIG5ldyBvcmlnaW5hbFxyXG4gICAgICAgIHZhciB0cyA9IHRoaXMuZGF0YS5tb2RlbC5kYXRhVGltZXN0YW1wKCk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnB1c2goKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChzZXJ2ZXJEYXRhKSB7XHJcbiAgICAgICAgICAgIC8vIEV2ZXIgZGVlcENvcHksIHNpbmNlIHBsYWluIGRhdGEgZnJvbSB0aGUgc2VydmVyXHJcbiAgICAgICAgICAgIC8vIGNhbm5vdCBoYXZlIGNpcmN1bGFyIHJlZmVyZW5jZXM6XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5tb2RlbC51cGRhdGVXaXRoKHNlcnZlckRhdGEsIHRydWUpO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEubW9kZWwuZGF0YVRpbWVzdGFtcCh0cyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBwZXJzaXN0ZW50IGxvY2FsIGNvcHk/XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxvY2FsU3RvcmFnZU5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGxvY2FsZm9yYWdlLnNldEl0ZW0odGhpcy5sb2NhbFN0b3JhZ2VOYW1lLCBzZXJ2ZXJEYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gRXZlbnRcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdzYXZlZCcsIHNlcnZlckRhdGEpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gRmluYWxseTogY29tbW9uIHRhc2tzIG9uIHN1Y2Nlc3Mgb3IgZXJyb3JcclxuICAgICAgICAgICAgdGhpcy5pc1NhdmluZyhmYWxzZSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLmNhY2hlLmxhdGVzdCA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRhdGE7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxyXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgLy8gRmluYWxseTogY29tbW9uIHRhc2tzIG9uIHN1Y2Nlc3Mgb3IgZXJyb3JcclxuICAgICAgICAgICAgdGhpcy5pc1NhdmluZyhmYWxzZSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBFdmVudFxyXG4gICAgICAgICAgICB2YXIgZXJyUGtnID0ge1xyXG4gICAgICAgICAgICAgICAgdGFzazogJ3NhdmUnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVyclxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvLyBCZSBjYXJlZnVsIHdpdGggJ2Vycm9yJyBldmVudCwgaXMgc3BlY2lhbCBhbmQgc3RvcHMgZXhlY3V0aW9uIG9uIGVtaXRcclxuICAgICAgICAgICAgLy8gaWYgbm8gbGlzdGVuZXJzIGF0dGFjaGVkOiBvdmVyd3JpdHRpbmcgdGhhdCBiZWhhdmlvciBieSBqdXN0XHJcbiAgICAgICAgICAgIC8vIHByaW50IG9uIGNvbnNvbGUgd2hlbiBub3RoaW5nLCBvciBlbWl0IGlmIHNvbWUgbGlzdGVuZXI6XHJcbiAgICAgICAgICAgIGlmIChFdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCh0aGlzLCAnZXJyb3InKSA+IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnZXJyb3InLCBlcnJQa2cpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gTG9nIGl0IHdoZW4gbm90IGhhbmRsZWQgKGV2ZW4gaWYgdGhlIHByb21pc2UgZXJyb3IgaXMgaGFuZGxlZClcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1JlbW90ZU1vZGVsIEVycm9yJywgZXJyUGtnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gUmV0aHJvdyBlcnJvclxyXG4gICAgICAgICAgICByZXR1cm4gZXJyO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBMYXVuY2ggYSBzeW5jaW5nIHJlcXVlc3QuIFJldHVybnMgbm90aGluZywgdGhlXHJcbiAgICAgICAgd2F5IHRvIHRyYWNrIGFueSByZXN1bHQgaXMgd2l0aCBldmVudHMgb3IgXHJcbiAgICAgICAgdGhlIGluc3RhbmNlIG9ic2VydmFibGVzLlxyXG4gICAgICAgIElNUE9SVEFOVDogcmlnaHQgbm93IGlzIGp1c3QgYSByZXF1ZXN0IGZvciAnbG9hZCdcclxuICAgICAgICB0aGF0IGF2b2lkcyBwcm9taXNlIGVycm9ycyBmcm9tIHRocm93aW5nLlxyXG4gICAgKiovXHJcbiAgICB0aGlzLnN5bmMgPSBmdW5jdGlvbiBzeW5jKCkge1xyXG4gICAgICAgIC8vIENhbGwgZm9yIGEgbG9hZCwgdGhhdCB3aWxsIGJlIHRyZWF0ZWQgYXMgJ3N5bmNpbmcnIGFmdGVyIHRoZVxyXG4gICAgICAgIC8vIGZpcnN0IGxvYWRcclxuICAgICAgICB0aGlzLmxvYWQoKVxyXG4gICAgICAgIC8vIEF2b2lkIGVycm9ycyBmcm9tIHRocm93aW5nIGluIHRoZSBjb25zb2xlLFxyXG4gICAgICAgIC8vIHRoZSAnZXJyb3InIGV2ZW50IGlzIHRoZXJlIHRvIHRyYWNrIGFueW9uZS5cclxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oKSB7fSk7XHJcbiAgICB9O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlbW90ZU1vZGVsO1xyXG5cclxuUmVtb3RlTW9kZWwuX2luaGVyaXRzKEV2ZW50RW1pdHRlcik7XHJcbiIsIi8qKlxyXG4gICAgUkVTVCBBUEkgYWNjZXNzXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5mdW5jdGlvbiBsb3dlckZpcnN0TGV0dGVyKG4pIHtcclxuICAgIHJldHVybiBuICYmIG5bMF0gJiYgblswXS50b0xvd2VyQ2FzZSAmJiAoblswXS50b0xvd2VyQ2FzZSgpICsgbi5zbGljZSgxKSkgfHwgbjtcclxufVxyXG5cclxuZnVuY3Rpb24gbG93ZXJDYW1lbGl6ZU9iamVjdChvYmopIHtcclxuICAgIC8vanNoaW50IG1heGNvbXBsZXhpdHk6OFxyXG4gICAgXHJcbiAgICBpZiAoIW9iaiB8fCB0eXBlb2Yob2JqKSAhPT0gJ29iamVjdCcpIHJldHVybiBvYmo7XHJcblxyXG4gICAgdmFyIHJldCA9IEFycmF5LmlzQXJyYXkob2JqKSA/IFtdIDoge307XHJcbiAgICBmb3IodmFyIGsgaW4gb2JqKSB7XHJcbiAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrKSkge1xyXG4gICAgICAgICAgICB2YXIgbmV3ayA9IGxvd2VyRmlyc3RMZXR0ZXIoayk7XHJcbiAgICAgICAgICAgIHJldFtuZXdrXSA9IHR5cGVvZihvYmpba10pID09PSAnb2JqZWN0JyA/XHJcbiAgICAgICAgICAgICAgICBsb3dlckNhbWVsaXplT2JqZWN0KG9ialtrXSkgOlxyXG4gICAgICAgICAgICAgICAgb2JqW2tdXHJcbiAgICAgICAgICAgIDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmV0O1xyXG59XHJcblxyXG5mdW5jdGlvbiBSZXN0KG9wdGlvbnNPclVybCkge1xyXG4gICAgXHJcbiAgICB2YXIgdXJsID0gdHlwZW9mKG9wdGlvbnNPclVybCkgPT09ICdzdHJpbmcnID9cclxuICAgICAgICBvcHRpb25zT3JVcmwgOlxyXG4gICAgICAgIG9wdGlvbnNPclVybCAmJiBvcHRpb25zT3JVcmwudXJsO1xyXG5cclxuICAgIHRoaXMuYmFzZVVybCA9IHVybDtcclxuICAgIC8vIE9wdGlvbmFsIGV4dHJhSGVhZGVycyBmb3IgYWxsIHJlcXVlc3RzLFxyXG4gICAgLy8gdXN1YWxseSBmb3IgYXV0aGVudGljYXRpb24gdG9rZW5zXHJcbiAgICB0aGlzLmV4dHJhSGVhZGVycyA9IG51bGw7XHJcbn1cclxuXHJcblJlc3QucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldChhcGlVcmwsIGRhdGEpIHtcclxuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoYXBpVXJsLCAnZ2V0JywgZGF0YSk7XHJcbn07XHJcblxyXG5SZXN0LnByb3RvdHlwZS5wdXQgPSBmdW5jdGlvbiBnZXQoYXBpVXJsLCBkYXRhKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KGFwaVVybCwgJ3B1dCcsIGRhdGEpO1xyXG59O1xyXG5cclxuUmVzdC5wcm90b3R5cGUucG9zdCA9IGZ1bmN0aW9uIGdldChhcGlVcmwsIGRhdGEpIHtcclxuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoYXBpVXJsLCAncG9zdCcsIGRhdGEpO1xyXG59O1xyXG5cclxuUmVzdC5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gZ2V0KGFwaVVybCwgZGF0YSkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChhcGlVcmwsICdkZWxldGUnLCBkYXRhKTtcclxufTtcclxuXHJcblJlc3QucHJvdG90eXBlLnB1dEZpbGUgPSBmdW5jdGlvbiBwdXRGaWxlKGFwaVVybCwgZGF0YSkge1xyXG4gICAgLy8gTk9URSBiYXNpYyBwdXRGaWxlIGltcGxlbWVudGF0aW9uLCBvbmUgZmlsZSwgdXNlIGZpbGVVcGxvYWQ/XHJcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KGFwaVVybCwgJ2RlbGV0ZScsIGRhdGEsICdtdWx0aXBhcnQvZm9ybS1kYXRhJyk7XHJcbn07XHJcblxyXG5SZXN0LnByb3RvdHlwZS5yZXF1ZXN0ID0gZnVuY3Rpb24gcmVxdWVzdChhcGlVcmwsIGh0dHBNZXRob2QsIGRhdGEsIGNvbnRlbnRUeXBlKSB7XHJcbiAgICBcclxuICAgIHZhciB0aGlzUmVzdCA9IHRoaXM7XHJcbiAgICB2YXIgdXJsID0gdGhpcy5iYXNlVXJsICsgYXBpVXJsO1xyXG5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoJC5hamF4KHtcclxuICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICAvLyBBdm9pZCBjYWNoZSBmb3IgZGF0YS5cclxuICAgICAgICBjYWNoZTogZmFsc2UsXHJcbiAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuICAgICAgICBtZXRob2Q6IGh0dHBNZXRob2QsXHJcbiAgICAgICAgaGVhZGVyczogdGhpcy5leHRyYUhlYWRlcnMsXHJcbiAgICAgICAgLy8gVVJMRU5DT0RFRCBpbnB1dDpcclxuICAgICAgICAvLyBDb252ZXJ0IHRvIEpTT04gYW5kIGJhY2sganVzdCB0byBlbnN1cmUgdGhlIHZhbHVlcyBhcmUgY29udmVydGVkL2VuY29kZWRcclxuICAgICAgICAvLyBwcm9wZXJseSB0byBiZSBzZW50LCBsaWtlIERhdGVzIGJlaW5nIGNvbnZlcnRlZCB0byBJU08gZm9ybWF0LlxyXG4gICAgICAgIGRhdGE6IGRhdGEgJiYgSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkYXRhKSksXHJcbiAgICAgICAgY29udGVudFR5cGU6IGNvbnRlbnRUeXBlIHx8ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnXHJcbiAgICAgICAgLy8gQWx0ZXJuYXRlOiBKU09OIGFzIGlucHV0XHJcbiAgICAgICAgLy9kYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKSxcclxuICAgICAgICAvL2NvbnRlbnRUeXBlOiBjb250ZW50VHlwZSB8fCAnYXBwbGljYXRpb24vanNvbidcclxuICAgIH0pKVxyXG4gICAgLnRoZW4obG93ZXJDYW1lbGl6ZU9iamVjdClcclxuICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAvLyBPbiBhdXRob3JpemF0aW9uIGVycm9yLCBnaXZlIG9wb3J0dW5pdHkgdG8gcmV0cnkgdGhlIG9wZXJhdGlvblxyXG4gICAgICAgIGlmIChlcnIuc3RhdHVzID09PSA0MDEpIHtcclxuICAgICAgICAgICAgdmFyIHJldHJ5ID0gcmVxdWVzdC5iaW5kKHRoaXMsIGFwaVVybCwgaHR0cE1ldGhvZCwgZGF0YSwgY29udGVudFR5cGUpO1xyXG4gICAgICAgICAgICB2YXIgcmV0cnlQcm9taXNlID0gdGhpc1Jlc3Qub25BdXRob3JpemF0aW9uUmVxdWlyZWQocmV0cnkpO1xyXG4gICAgICAgICAgICBpZiAocmV0cnlQcm9taXNlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJdCByZXR1cm5lZCBzb21ldGhpbmcsIGV4cGVjdGluZyBpcyBhIHByb21pc2U6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJldHJ5UHJvbWlzZSlcclxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZXJlIGlzIGVycm9yIG9uIHJldHJ5LCBqdXN0IHJldHVybiB0aGVcclxuICAgICAgICAgICAgICAgICAgICAvLyBvcmlnaW5hbCBjYWxsIGVycm9yXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycjtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGJ5IGRlZmF1bHQsIGNvbnRpbnVlIHByb3BhZ2F0aW5nIHRoZSBlcnJvclxyXG4gICAgICAgIHJldHVybiBlcnI7XHJcbiAgICB9KTtcclxufTtcclxuXHJcblJlc3QucHJvdG90eXBlLm9uQXV0aG9yaXphdGlvblJlcXVpcmVkID0gZnVuY3Rpb24gb25BdXRob3JpemF0aW9uUmVxdWlyZWQoLypyZXRyeSovKSB7XHJcbiAgICAvLyBUbyBiZSBpbXBsZW1lbnRlZCBvdXRzaWRlLCBpZiBjb252ZW5pZW50IGV4ZWN1dGluZzpcclxuICAgIC8vcmV0cnkoKTtcclxuICAgIC8vIGJ5IGRlZmF1bHQgZG9uJ3Qgd2FpdCBmb3IgcmV0cnksIGp1c3QgcmV0dXJuIG5vdGhpbmc6XHJcbiAgICByZXR1cm47XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlc3Q7XHJcbiIsIi8qKlxyXG4gICAgVGltZSBjbGFzcyB1dGlsaXR5LlxyXG4gICAgU2hvcnRlciB3YXkgdG8gY3JlYXRlIGEgRGF0ZSBpbnN0YW5jZVxyXG4gICAgc3BlY2lmeWluZyBvbmx5IHRoZSBUaW1lIHBhcnQsXHJcbiAgICBkZWZhdWx0aW5nIHRvIGN1cnJlbnQgZGF0ZSBvciBcclxuICAgIGFub3RoZXIgcmVhZHkgZGF0ZSBpbnN0YW5jZS5cclxuKiovXHJcbmZ1bmN0aW9uIFRpbWUoZGF0ZSwgaG91ciwgbWludXRlLCBzZWNvbmQpIHtcclxuICAgIGlmICghKGRhdGUgaW5zdGFuY2VvZiBEYXRlKSkge1xyXG4gXHJcbiAgICAgICAgc2Vjb25kID0gbWludXRlO1xyXG4gICAgICAgIG1pbnV0ZSA9IGhvdXI7XHJcbiAgICAgICAgaG91ciA9IGRhdGU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZGF0ZSA9IG5ldyBEYXRlKCk7ICAgXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBEYXRlKGRhdGUuZ2V0RnVsbFllYXIoKSwgZGF0ZS5nZXRNb250aCgpLCBkYXRlLmdldERhdGUoKSwgaG91ciB8fCAwLCBtaW51dGUgfHwgMCwgc2Vjb25kIHx8IDApO1xyXG59XHJcbm1vZHVsZS5leHBvcnRzID0gVGltZTtcclxuIiwiLyoqXHJcbiAgICBDcmVhdGUgYW4gQWNjZXNzIENvbnRyb2wgZm9yIGFuIGFwcCB0aGF0IGp1c3QgY2hlY2tzXHJcbiAgICB0aGUgYWN0aXZpdHkgcHJvcGVydHkgZm9yIGFsbG93ZWQgdXNlciBsZXZlbC5cclxuICAgIFRvIGJlIHByb3ZpZGVkIHRvIFNoZWxsLmpzIGFuZCB1c2VkIGJ5IHRoZSBhcHAuanMsXHJcbiAgICB2ZXJ5IHRpZWQgdG8gdGhhdCBib3RoIGNsYXNzZXMuXHJcbiAgICBcclxuICAgIEFjdGl2aXRpZXMgY2FuIGRlZmluZSBvbiBpdHMgb2JqZWN0IGFuIGFjY2Vzc0xldmVsXHJcbiAgICBwcm9wZXJ0eSBsaWtlIG5leHQgZXhhbXBsZXNcclxuICAgIFxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VydHlwZS5Vc2VyOyAvLyBhbnlvbmVcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuQW5vbnltb3VzOyAvLyBhbm9ueW1vdXMgdXNlcnMgb25seVxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyOyAvLyBhdXRoZW50aWNhdGVkIHVzZXJzIG9ubHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbi8vIFVzZXJUeXBlIGVudW1lcmF0aW9uIGlzIGJpdCBiYXNlZCwgc28gc2V2ZXJhbFxyXG4vLyB1c2VycyBjYW4gaGFzIGFjY2VzcyBpbiBhIHNpbmdsZSBwcm9wZXJ0eVxyXG4vL3ZhciBVc2VyVHlwZSA9IHJlcXVpcmUoJy4uL21vZGVscy9Vc2VyJykuVXNlclR5cGU7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZUFjY2Vzc0NvbnRyb2woYXBwKSB7XHJcbiAgICBcclxuICAgIHJldHVybiBmdW5jdGlvbiBhY2Nlc3NDb250cm9sKHJvdXRlKSB7XHJcblxyXG4gICAgICAgIHZhciBhY3Rpdml0eSA9IGFwcC5nZXRBY3Rpdml0eUNvbnRyb2xsZXJCeVJvdXRlKHJvdXRlKTtcclxuXHJcbiAgICAgICAgdmFyIHVzZXIgPSBhcHAubW9kZWwudXNlcigpO1xyXG4gICAgICAgIHZhciBjdXJyZW50VHlwZSA9IHVzZXIgJiYgdXNlci51c2VyVHlwZSgpO1xyXG5cclxuICAgICAgICBpZiAoYWN0aXZpdHkgJiYgYWN0aXZpdHkuYWNjZXNzTGV2ZWwpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBjYW4gPSBhY3Rpdml0eS5hY2Nlc3NMZXZlbCAmIGN1cnJlbnRUeXBlO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKCFjYW4pIHtcclxuICAgICAgICAgICAgICAgIC8vIE5vdGlmeSBlcnJvciwgd2h5IGNhbm5vdCBhY2Nlc3NcclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWRMZXZlbDogYWN0aXZpdHkuYWNjZXNzTGV2ZWwsXHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFR5cGU6IGN1cnJlbnRUeXBlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBBbGxvd1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfTtcclxufTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIHVud3JhcCA9IGZ1bmN0aW9uIHVud3JhcCh2YWx1ZSkge1xyXG4gICAgcmV0dXJuICh0eXBlb2YodmFsdWUpID09PSAnZnVuY3Rpb24nID8gdmFsdWUoKSA6IHZhbHVlKTtcclxufTtcclxuXHJcbmV4cG9ydHMuZGVmaW5lQ3J1ZEFwaUZvclJlc3QgPSBmdW5jdGlvbiBkZWZpbmVDcnVkQXBpRm9yUmVzdChzZXR0aW5ncykge1xyXG4gICAgXHJcbiAgICB2YXIgZXh0ZW5kZWRPYmplY3QgPSBzZXR0aW5ncy5leHRlbmRlZE9iamVjdCxcclxuICAgICAgICBNb2RlbCA9IHNldHRpbmdzLk1vZGVsLFxyXG4gICAgICAgIG1vZGVsTmFtZSA9IHNldHRpbmdzLm1vZGVsTmFtZSxcclxuICAgICAgICBtb2RlbExpc3ROYW1lID0gc2V0dGluZ3MubW9kZWxMaXN0TmFtZSxcclxuICAgICAgICBtb2RlbFVybCA9IHNldHRpbmdzLm1vZGVsVXJsLFxyXG4gICAgICAgIGlkUHJvcGVydHlOYW1lID0gc2V0dGluZ3MuaWRQcm9wZXJ0eU5hbWU7XHJcblxyXG4gICAgZXh0ZW5kZWRPYmplY3RbJ2dldCcgKyBtb2RlbExpc3ROYW1lXSA9IGZ1bmN0aW9uIGdldExpc3QoZmlsdGVycykge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLnJlc3QuZ2V0KG1vZGVsVXJsLCBmaWx0ZXJzKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJhd0l0ZW1zKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByYXdJdGVtcyAmJiByYXdJdGVtcy5tYXAoZnVuY3Rpb24ocmF3SXRlbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBNb2RlbChyYXdJdGVtKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBleHRlbmRlZE9iamVjdFsnZ2V0JyArIG1vZGVsTmFtZV0gPSBmdW5jdGlvbiBnZXRJdGVtKGl0ZW1JRCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLnJlc3QuZ2V0KG1vZGVsVXJsICsgJy8nICsgaXRlbUlEKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJhd0l0ZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJhd0l0ZW0gJiYgbmV3IE1vZGVsKHJhd0l0ZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBleHRlbmRlZE9iamVjdFsncG9zdCcgKyBtb2RlbE5hbWVdID0gZnVuY3Rpb24gcG9zdEl0ZW0oYW5JdGVtKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5wb3N0KG1vZGVsVXJsLCBhbkl0ZW0pXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oc2VydmVySXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IE1vZGVsKHNlcnZlckl0ZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBleHRlbmRlZE9iamVjdFsncHV0JyArIG1vZGVsTmFtZV0gPSBmdW5jdGlvbiBwdXRJdGVtKGFuSXRlbSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlc3QucHV0KG1vZGVsVXJsICsgJy8nICsgdW53cmFwKGFuSXRlbVtpZFByb3BlcnR5TmFtZV0pLCBhbkl0ZW0pXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oc2VydmVySXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IE1vZGVsKHNlcnZlckl0ZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgZXh0ZW5kZWRPYmplY3RbJ3NldCcgKyBtb2RlbE5hbWVdID0gZnVuY3Rpb24gc2V0SXRlbShhbkl0ZW0pIHtcclxuICAgICAgICB2YXIgaWQgPSB1bndyYXAoYW5JdGVtW2lkUHJvcGVydHlOYW1lXSk7XHJcbiAgICAgICAgaWYgKGlkKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1sncHV0JyArIG1vZGVsTmFtZV0oYW5JdGVtKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzWydwb3N0JyArIG1vZGVsTmFtZV0oYW5JdGVtKTtcclxuICAgIH07XHJcblxyXG4gICAgZXh0ZW5kZWRPYmplY3RbJ2RlbCcgKyBtb2RlbE5hbWVdID0gZnVuY3Rpb24gZGVsSXRlbShhbkl0ZW0pIHtcclxuICAgICAgICB2YXIgaWQgPSBhbkl0ZW0gJiYgdW53cmFwKGFuSXRlbVtpZFByb3BlcnR5TmFtZV0pIHx8XHJcbiAgICAgICAgICAgICAgICBhbkl0ZW07XHJcbiAgICAgICAgaWYgKGlkKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXN0LmRlbGV0ZShtb2RlbFVybCArICcvJyArIGlkLCBhbkl0ZW0pXHJcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGRlbGV0ZWRJdGVtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVsZXRlZEl0ZW0gJiYgbmV3IE1vZGVsKGRlbGV0ZWRJdGVtKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05lZWQgYW4gSUQgb3IgYW4gb2JqZWN0IHdpdGggdGhlIElEIHByb3BlcnR5IHRvIGRlbGV0ZScpO1xyXG4gICAgfTtcclxufTsiLCIvKipcclxuICAgIEJvb3Rrbm9jazogU2V0IG9mIEtub2Nrb3V0IEJpbmRpbmcgSGVscGVycyBmb3IgQm9vdHN0cmFwIGpzIGNvbXBvbmVudHMgKGpxdWVyeSBwbHVnaW5zKVxyXG4gICAgXHJcbiAgICBEZXBlbmRlbmNpZXM6IGpxdWVyeVxyXG4gICAgSW5qZWN0ZWQgZGVwZW5kZW5jaWVzOiBrbm9ja291dFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy8gRGVwZW5kZW5jaWVzXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbi8vIERJIGkxOG4gbGlicmFyeVxyXG5leHBvcnRzLmkxOG4gPSBudWxsO1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlSGVscGVycyhrbykge1xyXG4gICAgdmFyIGhlbHBlcnMgPSB7fTtcclxuXHJcbiAgICAvKiogUG9wb3ZlciBCaW5kaW5nICoqL1xyXG4gICAgaGVscGVycy5wb3BvdmVyID0ge1xyXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24oZWxlbWVudCwgdmFsdWVBY2Nlc3Nvcikge1xyXG4gICAgICAgICAgICB2YXIgc3JjT3B0aW9ucyA9IGtvLnVud3JhcCh2YWx1ZUFjY2Vzc29yKCkpO1xyXG5cclxuICAgICAgICAgICAgLy8gRHVwbGljYXRpbmcgb3B0aW9ucyBvYmplY3QgdG8gcGFzcyB0byBwb3BvdmVyIHdpdGhvdXRcclxuICAgICAgICAgICAgLy8gb3ZlcndyaXR0bmcgc291cmNlIGNvbmZpZ3VyYXRpb25cclxuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc3JjT3B0aW9ucyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBVbndyYXBwaW5nIGNvbnRlbnQgdGV4dFxyXG4gICAgICAgICAgICBvcHRpb25zLmNvbnRlbnQgPSBrby51bndyYXAoc3JjT3B0aW9ucy5jb250ZW50KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmNvbnRlbnQpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBMb2NhbGl6ZTpcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMuY29udGVudCA9IFxyXG4gICAgICAgICAgICAgICAgICAgIGV4cG9ydHMuaTE4biAmJiBleHBvcnRzLmkxOG4udChvcHRpb25zLmNvbnRlbnQpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5jb250ZW50O1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBUbyBnZXQgdGhlIG5ldyBvcHRpb25zLCB3ZSBuZWVkIGRlc3Ryb3kgaXQgZmlyc3Q6XHJcbiAgICAgICAgICAgICAgICAkKGVsZW1lbnQpLnBvcG92ZXIoJ2Rlc3Ryb3knKS5wb3BvdmVyKG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFNlIG11ZXN0cmEgc2kgZWwgZWxlbWVudG8gdGllbmUgZWwgZm9jb1xyXG4gICAgICAgICAgICAgICAgaWYgKCQoZWxlbWVudCkuaXMoJzpmb2N1cycpKVxyXG4gICAgICAgICAgICAgICAgICAgICQoZWxlbWVudCkucG9wb3Zlcignc2hvdycpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICQoZWxlbWVudCkucG9wb3ZlcignZGVzdHJveScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGhlbHBlcnM7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgUGx1ZyBoZWxwZXJzIGluIHRoZSBwcm92aWRlZCBLbm9ja291dCBpbnN0YW5jZVxyXG4qKi9cclxuZnVuY3Rpb24gcGx1Z0luKGtvLCBwcmVmaXgpIHtcclxuICAgIHZhciBuYW1lLFxyXG4gICAgICAgIGhlbHBlcnMgPSBjcmVhdGVIZWxwZXJzKGtvKTtcclxuICAgIFxyXG4gICAgZm9yKHZhciBoIGluIGhlbHBlcnMpIHtcclxuICAgICAgICBpZiAoaGVscGVycy5oYXNPd25Qcm9wZXJ0eSAmJiAhaGVscGVycy5oYXNPd25Qcm9wZXJ0eShoKSlcclxuICAgICAgICAgICAgY29udGludWU7XHJcblxyXG4gICAgICAgIG5hbWUgPSBwcmVmaXggPyBwcmVmaXggKyBoWzBdLnRvVXBwZXJDYXNlKCkgKyBoLnNsaWNlKDEpIDogaDtcclxuICAgICAgICBrby5iaW5kaW5nSGFuZGxlcnNbbmFtZV0gPSBoZWxwZXJzW2hdO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnRzLnBsdWdJbiA9IHBsdWdJbjtcclxuZXhwb3J0cy5jcmVhdGVCaW5kaW5nSGVscGVycyA9IGNyZWF0ZUhlbHBlcnM7XHJcbiIsIi8qKlxyXG4gICAgS25vY2tvdXQgQmluZGluZyBIZWxwZXIgZm9yIHRoZSBCb290c3RyYXAgU3dpdGNoIHBsdWdpbi5cclxuICAgIFxyXG4gICAgRGVwZW5kZW5jaWVzOiBqcXVlcnksIGJvb3RzdHJhcCwgYm9vdHN0cmFwLXN3aXRjaFxyXG4gICAgSW5qZWN0ZWQgZGVwZW5kZW5jaWVzOiBrbm9ja291dFxyXG4gICAgXHJcbiAgICBJTVBPUlRBTlQgTk9URVM6XHJcbiAgICAtIEEgY29uc29sZSBlcnJvciBvZiB0eXBlIFwib2JqZWN0IGhhcyBub3QgdGhhdCBwcm9wZXJ0eVwiIHdpbGwgaGFwcGVuIGlmIHNwZWNpZmllZFxyXG4gICAgICAgIGEgbm9uIGV4aXN0YW50IG9wdGlvbiBpbiB0aGUgYmluZGluZy4gVGhlIGVycm9yIGxvb2tzIHN0cmFuZ2Ugd2hlbiB1c2luZyB0aGUgbWluaWZpZWQgZmlsZS5cclxuICAgIC0gVGhlIG9yZGVyIG9mIG9wdGlvbnMgaW4gdGhlIGJpbmRpbmcgbWF0dGVycyB3aGVuIGNvbWJpbmluZyB3aXRoIGRpc2FibGVkIGFuZCByZWFkb25seVxyXG4gICAgICAgIG9wdGlvbnM6IGlmIHRoZSBlbGVtZW50IGlzIGRpc2FibGVkOnRydWUgb3IgcmVhZG9ubHk6dHJ1ZSwgYW55IGF0dGVtcHQgdG8gY2hhbmdlIHRoZVxyXG4gICAgICAgIHZhbHVlIHdpbGwgZmFpbCBzaWxlbnRseSwgc28gaWYgdGhlIHNhbWUgYmluZGluZyB1cGRhdGUgY2hhbmdlcyBkaXNhYmxlZCB0byBmYWxzZVxyXG4gICAgICAgIGFuZCB0aGUgc3RhdGUsIHRoZSAnZGlzYWJsZWQnIGNoYW5nZSBtdXN0IGhhcHBlbnMgYmVmb3JlIHRoZSAnc3RhdGUnIGNoYW5nZSBzbyBib3RoXHJcbiAgICAgICAgYXJlIHN1Y2Nlc3NmdWxseSB1cGRhdGVkLiBGb3IgdGhhdCwganVzdCBzcGVjaWZ5ICdkaXNhYmxlZCcgYmVmb3JlICdzdGF0ZScgaW4gdGhlIGJpbmRpbmdzXHJcbiAgICAgICAgZGVmaW5pdGlvbi5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbi8vIERlcGVuZGVuY2llc1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdib290c3RyYXAnKTtcclxucmVxdWlyZSgnYm9vdHN0cmFwLXN3aXRjaCcpO1xyXG5cclxuLyoqXHJcbiAgICBDcmVhdGUgYW5kIHBsdWctaW4gdGhlIEJpbmRpbmcgaW4gdGhlIHByb3ZpZGVkIEtub2Nrb3V0IGluc3RhbmNlXHJcbioqL1xyXG5leHBvcnRzLnBsdWdJbiA9IGZ1bmN0aW9uIHBsdWdJbihrbywgcHJlZml4KSB7XHJcblxyXG4gICAga28uYmluZGluZ0hhbmRsZXJzW3ByZWZpeCA/IHByZWZpeCArICdzd2l0Y2gnIDogJ3N3aXRjaCddID0ge1xyXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IpIHtcclxuICAgICAgICAgICAgLy8gQ3JlYXRlIHBsdWdpbiBpbnN0YW5jZVxyXG4gICAgICAgICAgICAkKGVsZW1lbnQpLmJvb3RzdHJhcFN3aXRjaCgpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnc3dpdGNoIGluaXQnLCBrby50b0pTKHZhbHVlQWNjZXNzb3IoKSkpO1xyXG5cclxuICAgICAgICAgICAgLy8gVXBkYXRpbmcgdmFsdWUgb24gcGx1Z2luIGNoYW5nZXNcclxuICAgICAgICAgICAgJChlbGVtZW50KS5vbignc3dpdGNoQ2hhbmdlLmJvb3RzdHJhcFN3aXRjaCcsIGZ1bmN0aW9uIChlLCBzdGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHYgPSB2YWx1ZUFjY2Vzc29yKCkgfHwge307XHJcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzd2l0Y2hDaGFuZ2UnLCBrby50b0pTKHYpKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gY2hhbmdlZD9cclxuICAgICAgICAgICAgICAgIHZhciBvbGRTdGF0ZSA9ICEha28udW53cmFwKHYuc3RhdGUpLFxyXG4gICAgICAgICAgICAgICAgICAgIG5ld1N0YXRlID0gISFzdGF0ZTtcclxuICAgICAgICAgICAgICAgIC8vIE9ubHkgdXBkYXRlIG9uIGNoYW5nZVxyXG4gICAgICAgICAgICAgICAgaWYgKG9sZFN0YXRlICE9PSBuZXdTdGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChrby5pc09ic2VydmFibGUodi5zdGF0ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtvLmlzV3JpdGVhYmxlT2JzZXJ2YWJsZSh2LnN0YXRlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdi5zdGF0ZShuZXdTdGF0ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2LnN0YXRlID0gbmV3U3RhdGU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24oZWxlbWVudCwgdmFsdWVBY2Nlc3Nvcikge1xyXG4gICAgICAgICAgICAvLyBHZXQgb3B0aW9ucyB0byBiZSBhcHBsaWVkIHRvIHRoZSBwbHVnaW4gaW5zdGFuY2VcclxuICAgICAgICAgICAgdmFyIHNyY09wdGlvbnMgPSB2YWx1ZUFjY2Vzc29yKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHNyY09wdGlvbnMgfHwge307XHJcblxyXG4gICAgICAgICAgICAvLyBVbndyYXBwaW5nIGV2ZXJ5IG9wdGlvbiB2YWx1ZSwgZ2V0dGluZyBhIGR1cGxpY2F0ZWRcclxuICAgICAgICAgICAgLy8gcGxhaW4gb2JqZWN0XHJcbiAgICAgICAgICAgIG9wdGlvbnMgPSBrby50b0pTKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzd2l0Y2ggdXBkYXRlJywgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgICAgICB2YXIgJGVsID0gJChlbGVtZW50KTtcclxuICAgICAgICAgICAgLy8gVXBkYXRlIGV2ZXJ5IG9wdGlvbiBpbiB0aGUgcGx1Z2luXHJcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKG9wdGlvbnMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgICAgICAkZWwuYm9vdHN0cmFwU3dpdGNoKGtleSwgb3B0aW9uc1trZXldKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBFc3BhY2UgYSBzdHJpbmcgZm9yIHVzZSBvbiBhIFJlZ0V4cC5cclxuICAgIFVzdWFsbHksIHRvIGxvb2sgZm9yIGEgc3RyaW5nIGluIGEgdGV4dCBtdWx0aXBsZSB0aW1lc1xyXG4gICAgb3Igd2l0aCBzb21lIGV4cHJlc3Npb25zLCBzb21lIGNvbW1vbiBhcmUgXHJcbiAgICBsb29rIGZvciBhIHRleHQgJ2luIHRoZSBiZWdpbm5pbmcnICheKVxyXG4gICAgb3IgJ2F0IHRoZSBlbmQnICgkKS5cclxuICAgIFxyXG4gICAgQXV0aG9yOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vdXNlcnMvMTUxMzEyL2Nvb2xhajg2IGFuZCBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vdXNlcnMvOTQxMC9hcmlzdG90bGUtcGFnYWx0emlzXHJcbiAgICBMaW5rOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS82OTY5NDg2XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vLyBSZWZlcnJpbmcgdG8gdGhlIHRhYmxlIGhlcmU6XHJcbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL3JlZ2V4cFxyXG4vLyB0aGVzZSBjaGFyYWN0ZXJzIHNob3VsZCBiZSBlc2NhcGVkXHJcbi8vIFxcIF4gJCAqICsgPyAuICggKSB8IHsgfSBbIF1cclxuLy8gVGhlc2UgY2hhcmFjdGVycyBvbmx5IGhhdmUgc3BlY2lhbCBtZWFuaW5nIGluc2lkZSBvZiBicmFja2V0c1xyXG4vLyB0aGV5IGRvIG5vdCBuZWVkIHRvIGJlIGVzY2FwZWQsIGJ1dCB0aGV5IE1BWSBiZSBlc2NhcGVkXHJcbi8vIHdpdGhvdXQgYW55IGFkdmVyc2UgZWZmZWN0cyAodG8gdGhlIGJlc3Qgb2YgbXkga25vd2xlZGdlIGFuZCBjYXN1YWwgdGVzdGluZylcclxuLy8gOiAhICwgPSBcclxuLy8gbXkgdGVzdCBcIn4hQCMkJV4mKigpe31bXWAvPT8rXFx8LV87OidcXFwiLDwuPlwiLm1hdGNoKC9bXFwjXS9nKVxyXG5cclxudmFyIHNwZWNpYWxzID0gW1xyXG4gICAgLy8gb3JkZXIgbWF0dGVycyBmb3IgdGhlc2VcclxuICAgICAgXCItXCJcclxuICAgICwgXCJbXCJcclxuICAgICwgXCJdXCJcclxuICAgIC8vIG9yZGVyIGRvZXNuJ3QgbWF0dGVyIGZvciBhbnkgb2YgdGhlc2VcclxuICAgICwgXCIvXCJcclxuICAgICwgXCJ7XCJcclxuICAgICwgXCJ9XCJcclxuICAgICwgXCIoXCJcclxuICAgICwgXCIpXCJcclxuICAgICwgXCIqXCJcclxuICAgICwgXCIrXCJcclxuICAgICwgXCI/XCJcclxuICAgICwgXCIuXCJcclxuICAgICwgXCJcXFxcXCJcclxuICAgICwgXCJeXCJcclxuICAgICwgXCIkXCJcclxuICAgICwgXCJ8XCJcclxuICBdXHJcblxyXG4gIC8vIEkgY2hvb3NlIHRvIGVzY2FwZSBldmVyeSBjaGFyYWN0ZXIgd2l0aCAnXFwnXHJcbiAgLy8gZXZlbiB0aG91Z2ggb25seSBzb21lIHN0cmljdGx5IHJlcXVpcmUgaXQgd2hlbiBpbnNpZGUgb2YgW11cclxuLCByZWdleCA9IFJlZ0V4cCgnWycgKyBzcGVjaWFscy5qb2luKCdcXFxcJykgKyAnXScsICdnJylcclxuO1xyXG5cclxudmFyIGVzY2FwZVJlZ0V4cCA9IGZ1bmN0aW9uIChzdHIpIHtcclxucmV0dXJuIHN0ci5yZXBsYWNlKHJlZ2V4LCBcIlxcXFwkJlwiKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZXNjYXBlUmVnRXhwO1xyXG5cclxuLy8gdGVzdCBlc2NhcGVSZWdFeHAoXCIvcGF0aC90by9yZXM/c2VhcmNoPXRoaXMudGhhdFwiKVxyXG4iLCIvKipcclxuKiBlc2NhcGVTZWxlY3RvclxyXG4qXHJcbiogc291cmNlOiBodHRwOi8va2p2YXJnYS5ibG9nc3BvdC5jb20uZXMvMjAwOS8wNi9qcXVlcnktcGx1Z2luLXRvLWVzY2FwZS1jc3Mtc2VsZWN0b3IuaHRtbFxyXG4qXHJcbiogRXNjYXBlIGFsbCBzcGVjaWFsIGpRdWVyeSBDU1Mgc2VsZWN0b3IgY2hhcmFjdGVycyBpbiAqc2VsZWN0b3IqLlxyXG4qIFVzZWZ1bCB3aGVuIHlvdSBoYXZlIGEgY2xhc3Mgb3IgaWQgd2hpY2ggY29udGFpbnMgc3BlY2lhbCBjaGFyYWN0ZXJzXHJcbiogd2hpY2ggeW91IG5lZWQgdG8gaW5jbHVkZSBpbiBhIHNlbGVjdG9yLlxyXG4qL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgc3BlY2lhbHMgPSBbXHJcbiAgJyMnLCAnJicsICd+JywgJz0nLCAnPicsIFxyXG4gIFwiJ1wiLCAnOicsICdcIicsICchJywgJzsnLCAnLCdcclxuXTtcclxudmFyIHJlZ2V4U3BlY2lhbHMgPSBbXHJcbiAgJy4nLCAnKicsICcrJywgJ3wnLCAnWycsICddJywgJygnLCAnKScsICcvJywgJ14nLCAnJCdcclxuXTtcclxudmFyIHNSRSA9IG5ldyBSZWdFeHAoXHJcbiAgJygnICsgc3BlY2lhbHMuam9pbignfCcpICsgJ3xcXFxcJyArIHJlZ2V4U3BlY2lhbHMuam9pbignfFxcXFwnKSArICcpJywgJ2cnXHJcbik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgcmV0dXJuIHNlbGVjdG9yLnJlcGxhY2Uoc1JFLCAnXFxcXCQxJyk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgR2V0IGEgZ2l2ZW4gdmFsdWUgd3JhcHBlZCBpbiBhbiBvYnNlcnZhYmxlIG9yIHJldHVybnNcclxuICAgIGl0IGlmIGl0cyBhbHJlYWR5IGFuIG9ic2VydmFibGUgb3IganVzdCBhIGZ1bmN0aW9uLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZXRPYnNlcnZhYmxlKG9ic09yVmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2Yob2JzT3JWYWx1ZSkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgcmV0dXJuIG9ic09yVmFsdWU7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuIGtvLm9ic2VydmFibGUob2JzT3JWYWx1ZSk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgUmVhZCBhIHBhZ2UncyBHRVQgVVJMIHZhcmlhYmxlcyBhbmQgcmV0dXJuIHRoZW0gYXMgYW4gYXNzb2NpYXRpdmUgYXJyYXkuXHJcbioqL1xyXG4ndXNlciBzdHJpY3QnO1xyXG4vL2dsb2JhbCB3aW5kb3dcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0VXJsUXVlcnkodXJsKSB7XHJcblxyXG4gICAgdXJsID0gdXJsIHx8IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xyXG5cclxuICAgIHZhciB2YXJzID0gW10sIGhhc2gsXHJcbiAgICAgICAgcXVlcnlJbmRleCA9IHVybC5pbmRleE9mKCc/Jyk7XHJcbiAgICBpZiAocXVlcnlJbmRleCA+IC0xKSB7XHJcbiAgICAgICAgdmFyIGhhc2hlcyA9IHVybC5zbGljZShxdWVyeUluZGV4ICsgMSkuc3BsaXQoJyYnKTtcclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgaGFzaGVzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaGFzaCA9IGhhc2hlc1tpXS5zcGxpdCgnPScpO1xyXG4gICAgICAgICAgICB2YXJzLnB1c2goaGFzaFswXSk7XHJcbiAgICAgICAgICAgIHZhcnNbaGFzaFswXV0gPSBoYXNoWzFdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB2YXJzO1xyXG59O1xyXG4iLCIvLyBqUXVlcnkgcGx1Z2luIHRvIHNldCBtdWx0aWxpbmUgdGV4dCBpbiBhbiBlbGVtZW50LFxyXG4vLyBieSByZXBsYWNpbmcgXFxuIGJ5IDxici8+IHdpdGggY2FyZWZ1bCB0byBhdm9pZCBYU1MgYXR0YWNrcy5cclxuLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTMwODIwMjhcclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbiQuZm4ubXVsdGlsaW5lID0gZnVuY3Rpb24odGV4dCkge1xyXG4gICAgdGhpcy50ZXh0KHRleHQpO1xyXG4gICAgdGhpcy5odG1sKHRoaXMuaHRtbCgpLnJlcGxhY2UoL1xcbi9nLCc8YnIvPicpKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG4iLCIvKipcclxuICAgIFNldCBvZiB1dGlsaXRpZXMgdG8gZGVmaW5lIEphdmFzY3JpcHQgUHJvcGVydGllc1xyXG4gICAgaW5kZXBlbmRlbnRseSBvZiB0aGUgYnJvd3Nlci5cclxuICAgIFxyXG4gICAgQWxsb3dzIHRvIGRlZmluZSBnZXR0ZXJzIGFuZCBzZXR0ZXJzLlxyXG4gICAgXHJcbiAgICBBZGFwdGVkIGNvZGUgZnJvbSB0aGUgb3JpZ2luYWwgY3JlYXRlZCBieSBKZWZmIFdhbGRlblxyXG4gICAgaHR0cDovL3doZXJlc3dhbGRlbi5jb20vMjAxMC8wNC8xNi9tb3JlLXNwaWRlcm1vbmtleS1jaGFuZ2VzLWFuY2llbnQtZXNvdGVyaWMtdmVyeS1yYXJlbHktdXNlZC1zeW50YXgtZm9yLWNyZWF0aW5nLWdldHRlcnMtYW5kLXNldHRlcnMtaXMtYmVpbmctcmVtb3ZlZC9cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIGFjY2Vzc29yRGVzY3JpcHRvcihmaWVsZCwgZnVuKVxyXG57XHJcbiAgICB2YXIgZGVzYyA9IHsgZW51bWVyYWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH07XHJcbiAgICBkZXNjW2ZpZWxkXSA9IGZ1bjtcclxuICAgIHJldHVybiBkZXNjO1xyXG59XHJcblxyXG5mdW5jdGlvbiBkZWZpbmVHZXR0ZXIob2JqLCBwcm9wLCBnZXQpXHJcbntcclxuICAgIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydHkpXHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIHByb3AsIGFjY2Vzc29yRGVzY3JpcHRvcihcImdldFwiLCBnZXQpKTtcclxuICAgIGlmIChPYmplY3QucHJvdG90eXBlLl9fZGVmaW5lR2V0dGVyX18pXHJcbiAgICAgICAgcmV0dXJuIG9iai5fX2RlZmluZUdldHRlcl9fKHByb3AsIGdldCk7XHJcblxyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IGdldHRlcnNcIik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRlZmluZVNldHRlcihvYmosIHByb3AsIHNldClcclxue1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSlcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgcHJvcCwgYWNjZXNzb3JEZXNjcmlwdG9yKFwic2V0XCIsIHNldCkpO1xyXG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuX19kZWZpbmVTZXR0ZXJfXylcclxuICAgICAgICByZXR1cm4gb2JqLl9fZGVmaW5lU2V0dGVyX18ocHJvcCwgc2V0KTtcclxuXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgc2V0dGVyc1wiKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBkZWZpbmVHZXR0ZXI6IGRlZmluZUdldHRlcixcclxuICAgIGRlZmluZVNldHRlcjogZGVmaW5lU2V0dGVyXHJcbn07XHJcbiIsIi8qKlxyXG4gICAgRG9tSXRlbXNNYW5hZ2VyIGNsYXNzLCB0aGF0IG1hbmFnZSBhIGNvbGxlY3Rpb24gXHJcbiAgICBvZiBIVE1ML0RPTSBpdGVtcyB1bmRlciBhIHJvb3QvY29udGFpbmVyLCB3aGVyZVxyXG4gICAgb25seSBvbmUgZWxlbWVudCBhdCB0aGUgdGltZSBpcyB2aXNpYmxlLCBwcm92aWRpbmdcclxuICAgIHRvb2xzIHRvIHVuaXF1ZXJseSBpZGVudGlmeSB0aGUgaXRlbXMsXHJcbiAgICB0byBjcmVhdGUgb3IgdXBkYXRlIG5ldyBpdGVtcyAodGhyb3VnaCAnaW5qZWN0JyksXHJcbiAgICBnZXQgdGhlIGN1cnJlbnQsIGZpbmQgYnkgdGhlIElEIGFuZCBtb3JlLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGVzY2FwZVNlbGVjdG9yID0gcmVxdWlyZSgnLi4vZXNjYXBlU2VsZWN0b3InKTtcclxuXHJcbmZ1bmN0aW9uIERvbUl0ZW1zTWFuYWdlcihzZXR0aW5ncykge1xyXG5cclxuICAgIHRoaXMuaWRBdHRyaWJ1dGVOYW1lID0gc2V0dGluZ3MuaWRBdHRyaWJ1dGVOYW1lIHx8ICdpZCc7XHJcbiAgICB0aGlzLmFsbG93RHVwbGljYXRlcyA9ICEhc2V0dGluZ3MuYWxsb3dEdXBsaWNhdGVzIHx8IGZhbHNlO1xyXG4gICAgdGhpcy4kcm9vdCA9IG51bGw7XHJcbiAgICAvLyBPbiBwYWdlIHJlYWR5LCBnZXQgdGhlIHJvb3QgZWxlbWVudDpcclxuICAgICQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy4kcm9vdCA9ICQoc2V0dGluZ3Mucm9vdCB8fCAnYm9keScpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBEb21JdGVtc01hbmFnZXI7XHJcblxyXG5Eb21JdGVtc01hbmFnZXIucHJvdG90eXBlLmZpbmQgPSBmdW5jdGlvbiBmaW5kKGNvbnRhaW5lck5hbWUsIHJvb3QpIHtcclxuICAgIHZhciAkcm9vdCA9ICQocm9vdCB8fCB0aGlzLiRyb290KTtcclxuICAgIHJldHVybiAkcm9vdC5maW5kKCdbJyArIHRoaXMuaWRBdHRyaWJ1dGVOYW1lICsgJz1cIicgKyBlc2NhcGVTZWxlY3Rvcihjb250YWluZXJOYW1lKSArICdcIl0nKTtcclxufTtcclxuXHJcbkRvbUl0ZW1zTWFuYWdlci5wcm90b3R5cGUuZ2V0QWN0aXZlID0gZnVuY3Rpb24gZ2V0QWN0aXZlKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuJHJvb3QuZmluZCgnWycgKyB0aGlzLmlkQXR0cmlidXRlTmFtZSArICddOnZpc2libGUnKTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgSXQgYWRkcyB0aGUgaXRlbSBpbiB0aGUgaHRtbCBwcm92aWRlZCAoY2FuIGJlIG9ubHkgdGhlIGVsZW1lbnQgb3IgXHJcbiAgICBjb250YWluZWQgaW4gYW5vdGhlciBvciBhIGZ1bGwgaHRtbCBwYWdlKS5cclxuICAgIFJlcGxhY2VzIGFueSBleGlzdGFudCBpZiBkdXBsaWNhdGVzIGFyZSBub3QgYWxsb3dlZC5cclxuKiovXHJcbkRvbUl0ZW1zTWFuYWdlci5wcm90b3R5cGUuaW5qZWN0ID0gZnVuY3Rpb24gaW5qZWN0KG5hbWUsIGh0bWwpIHtcclxuXHJcbiAgICAvLyBGaWx0ZXJpbmcgaW5wdXQgaHRtbCAoY2FuIGJlIHBhcnRpYWwgb3IgZnVsbCBwYWdlcylcclxuICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEyODQ4Nzk4XHJcbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKC9eW1xcc1xcU10qPGJvZHkuKj8+fDxcXC9ib2R5PltcXHNcXFNdKiQvZywgJycpO1xyXG5cclxuICAgIC8vIENyZWF0aW5nIGEgd3JhcHBlciBhcm91bmQgdGhlIGh0bWxcclxuICAgIC8vIChjYW4gYmUgcHJvdmlkZWQgdGhlIGlubmVySHRtbCBvciBvdXRlckh0bWwsIGRvZXNuJ3QgbWF0dGVycyB3aXRoIG5leHQgYXBwcm9hY2gpXHJcbiAgICB2YXIgJGh0bWwgPSAkKCc8ZGl2Lz4nLCB7IGh0bWw6IGh0bWwgfSksXHJcbiAgICAgICAgLy8gV2UgbG9vayBmb3IgdGhlIGNvbnRhaW5lciBlbGVtZW50ICh3aGVuIHRoZSBvdXRlckh0bWwgaXMgcHJvdmlkZWQpXHJcbiAgICAgICAgJGMgPSB0aGlzLmZpbmQobmFtZSwgJGh0bWwpO1xyXG5cclxuICAgIGlmICgkYy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAvLyBJdHMgaW5uZXJIdG1sLCBzbyB0aGUgd3JhcHBlciBiZWNvbWVzIHRoZSBjb250YWluZXIgaXRzZWxmXHJcbiAgICAgICAgJGMgPSAkaHRtbC5hdHRyKHRoaXMuaWRBdHRyaWJ1dGVOYW1lLCBuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMuYWxsb3dEdXBsaWNhdGVzKSB7XHJcbiAgICAgICAgLy8gTm8gbW9yZSB0aGFuIG9uZSBjb250YWluZXIgaW5zdGFuY2UgY2FuIGV4aXN0cyBhdCB0aGUgc2FtZSB0aW1lXHJcbiAgICAgICAgLy8gV2UgbG9vayBmb3IgYW55IGV4aXN0ZW50IG9uZSBhbmQgaXRzIHJlcGxhY2VkIHdpdGggdGhlIG5ld1xyXG4gICAgICAgIHZhciAkcHJldiA9IHRoaXMuZmluZChuYW1lKTtcclxuICAgICAgICBpZiAoJHByZXYubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAkcHJldi5yZXBsYWNlV2l0aCgkYyk7XHJcbiAgICAgICAgICAgICRjID0gJHByZXY7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEFkZCB0byB0aGUgZG9jdW1lbnRcclxuICAgIC8vIChvbiB0aGUgY2FzZSBvZiBkdXBsaWNhdGVkIGZvdW5kLCB0aGlzIHdpbGwgZG8gbm90aGluZywgbm8gd29ycnkpXHJcbiAgICAkYy5hcHBlbmRUbyh0aGlzLiRyb290KTtcclxufTtcclxuXHJcbi8qKiBcclxuICAgIFRoZSBzd2l0Y2ggbWV0aG9kIHJlY2VpdmUgdGhlIGl0ZW1zIHRvIGludGVyY2hhbmdlIGFzIGFjdGl2ZSBvciBjdXJyZW50LFxyXG4gICAgdGhlICdmcm9tJyBhbmQgJ3RvJywgYW5kIHRoZSBzaGVsbCBpbnN0YW5jZSB0aGF0IE1VU1QgYmUgdXNlZFxyXG4gICAgdG8gbm90aWZ5IGVhY2ggZXZlbnQgdGhhdCBpbnZvbHZlcyB0aGUgaXRlbTpcclxuICAgIHdpbGxDbG9zZSwgd2lsbE9wZW4sIHJlYWR5LCBvcGVuZWQsIGNsb3NlZC5cclxuICAgIEl0IHJlY2VpdmVzIGFzIGxhdGVzdCBwYXJhbWV0ZXIgdGhlICdub3RpZmljYXRpb24nIG9iamVjdCB0aGF0IG11c3QgYmVcclxuICAgIHBhc3NlZCB3aXRoIHRoZSBldmVudCBzbyBoYW5kbGVycyBoYXMgY29udGV4dCBzdGF0ZSBpbmZvcm1hdGlvbi5cclxuICAgIFxyXG4gICAgSXQncyBkZXNpZ25lZCB0byBiZSBhYmxlIHRvIG1hbmFnZSB0cmFuc2l0aW9ucywgYnV0IHRoaXMgZGVmYXVsdFxyXG4gICAgaW1wbGVtZW50YXRpb24gaXMgYXMgc2ltcGxlIGFzICdzaG93IHRoZSBuZXcgYW5kIGhpZGUgdGhlIG9sZCcuXHJcbioqL1xyXG5Eb21JdGVtc01hbmFnZXIucHJvdG90eXBlLnN3aXRjaCA9IGZ1bmN0aW9uIHN3aXRjaEFjdGl2ZUl0ZW0oJGZyb20sICR0bywgc2hlbGwsIG5vdGlmaWNhdGlvbikge1xyXG5cclxuICAgIGlmICghJHRvLmlzKCc6dmlzaWJsZScpKSB7XHJcbiAgICAgICAgc2hlbGwuZW1pdChzaGVsbC5ldmVudHMud2lsbE9wZW4sICR0bywgbm90aWZpY2F0aW9uKTtcclxuICAgICAgICAkdG8uc2hvdygpO1xyXG4gICAgICAgIC8vIEl0cyBlbm91Z2ggdmlzaWJsZSBhbmQgaW4gRE9NIHRvIHBlcmZvcm0gaW5pdGlhbGl6YXRpb24gdGFza3NcclxuICAgICAgICAvLyB0aGF0IG1heSBpbnZvbHZlIGxheW91dCBpbmZvcm1hdGlvblxyXG4gICAgICAgIHNoZWxsLmVtaXQoc2hlbGwuZXZlbnRzLml0ZW1SZWFkeSwgJHRvLCBub3RpZmljYXRpb24pO1xyXG4gICAgICAgIC8vIFdoZW4gaXRzIGNvbXBsZXRlbHkgb3BlbmVkXHJcbiAgICAgICAgc2hlbGwuZW1pdChzaGVsbC5ldmVudHMub3BlbmVkLCAkdG8sIG5vdGlmaWNhdGlvbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEl0cyByZWFkeTsgbWF5YmUgaXQgd2FzIGJ1dCBzdWItbG9jYXRpb25cclxuICAgICAgICAvLyBvciBzdGF0ZSBjaGFuZ2UgbmVlZCB0byBiZSBjb21tdW5pY2F0ZWRcclxuICAgICAgICBzaGVsbC5lbWl0KHNoZWxsLmV2ZW50cy5pdGVtUmVhZHksICR0bywgbm90aWZpY2F0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoJGZyb20uaXMoJzp2aXNpYmxlJykpIHtcclxuICAgICAgICBzaGVsbC5lbWl0KHNoZWxsLmV2ZW50cy53aWxsQ2xvc2UsICRmcm9tLCBub3RpZmljYXRpb24pO1xyXG4gICAgICAgIC8vIERvICd1bmZvY3VzJyBvbiB0aGUgaGlkZGVuIGVsZW1lbnQgYWZ0ZXIgbm90aWZ5ICd3aWxsQ2xvc2UnXHJcbiAgICAgICAgLy8gZm9yIGJldHRlciBVWDogaGlkZGVuIGVsZW1lbnRzIGFyZSBub3QgcmVhY2hhYmxlIGFuZCBoYXMgZ29vZFxyXG4gICAgICAgIC8vIHNpZGUgZWZmZWN0cyBsaWtlIGhpZGRpbmcgdGhlIG9uLXNjcmVlbiBrZXlib2FyZCBpZiBhbiBpbnB1dCB3YXNcclxuICAgICAgICAvLyBmb2N1c2VkXHJcbiAgICAgICAgJGZyb20uZmluZCgnOmZvY3VzJykuYmx1cigpO1xyXG4gICAgICAgIC8vIGhpZGUgYW5kIG5vdGlmeSBpdCBlbmRlZFxyXG4gICAgICAgICRmcm9tLmhpZGUoKTtcclxuICAgICAgICBzaGVsbC5lbWl0KHNoZWxsLmV2ZW50cy5jbG9zZWQsICRmcm9tLCBub3RpZmljYXRpb24pO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAgICBJbml0aWFsaXplcyB0aGUgbGlzdCBvZiBpdGVtcy4gTm8gbW9yZSB0aGFuIG9uZVxyXG4gICAgbXVzdCBiZSBvcGVuZWQvdmlzaWJsZSBhdCB0aGUgc2FtZSB0aW1lLCBzbyBhdCB0aGUgXHJcbiAgICBpbml0IGFsbCB0aGUgZWxlbWVudHMgYXJlIGNsb3NlZCB3YWl0aW5nIHRvIHNldFxyXG4gICAgb25lIGFzIHRoZSBhY3RpdmUgb3IgdGhlIGN1cnJlbnQgb25lLlxyXG4qKi9cclxuRG9tSXRlbXNNYW5hZ2VyLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gaW5pdCgpIHtcclxuICAgIHRoaXMuZ2V0QWN0aXZlKCkuaGlkZSgpO1xyXG59O1xyXG4iLCIvKipcclxuICAgIEphdmFzY3JpdHAgU2hlbGwgZm9yIFNQQXMuXHJcbioqL1xyXG4vKmdsb2JhbCB3aW5kb3csIGRvY3VtZW50ICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKiBESSBlbnRyeSBwb2ludHMgZm9yIGRlZmF1bHQgYnVpbGRzLiBNb3N0IGRlcGVuZGVuY2llcyBjYW4gYmVcclxuICAgIHNwZWNpZmllZCBpbiB0aGUgY29uc3RydWN0b3Igc2V0dGluZ3MgZm9yIHBlci1pbnN0YW5jZSBzZXR1cC5cclxuKiovXHJcbnZhciBkZXBzID0gcmVxdWlyZSgnLi9kZXBlbmRlbmNpZXMnKTtcclxuXHJcbi8qKiBDb25zdHJ1Y3RvciAqKi9cclxuXHJcbmZ1bmN0aW9uIFNoZWxsKHNldHRpbmdzKSB7XHJcbiAgICAvL2pzaGludCBtYXhjb21wbGV4aXR5OjE0XHJcbiAgICBcclxuICAgIGRlcHMuRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XHJcblxyXG4gICAgdGhpcy4kID0gc2V0dGluZ3MuanF1ZXJ5IHx8IGRlcHMuanF1ZXJ5O1xyXG4gICAgdGhpcy4kcm9vdCA9IHRoaXMuJChzZXR0aW5ncy5yb290KTtcclxuICAgIHRoaXMuYmFzZVVybCA9IHNldHRpbmdzLmJhc2VVcmwgfHwgJyc7XHJcbiAgICAvLyBXaXRoIGZvcmNlSGFzaGJhbmc9dHJ1ZTpcclxuICAgIC8vIC0gZnJhZ21lbnRzIFVSTHMgY2Fubm90IGJlIHVzZWQgdG8gc2Nyb2xsIHRvIGFuIGVsZW1lbnQgKGRlZmF1bHQgYnJvd3NlciBiZWhhdmlvciksXHJcbiAgICAvLyAgIHRoZXkgYXJlIGRlZmF1bHRQcmV2ZW50ZWQgdG8gYXZvaWQgY29uZnVzZSB0aGUgcm91dGluZyBtZWNoYW5pc20gYW5kIGN1cnJlbnQgVVJMLlxyXG4gICAgLy8gLSBwcmVzc2VkIGxpbmtzIHRvIGZyYWdtZW50cyBVUkxzIGFyZSBub3Qgcm91dGVkLCB0aGV5IGFyZSBza2lwcGVkIHNpbGVudGx5XHJcbiAgICAvLyAgIGV4Y2VwdCB3aGVuIHRoZXkgYXJlIGEgaGFzaGJhbmcgKCMhKS4gVGhpcyB3YXksIHNwZWNpYWwgbGlua3NcclxuICAgIC8vICAgdGhhdCBwZXJmb3JtbiBqcyBhY3Rpb25zIGRvZXNuJ3QgY29uZmxpdHMuXHJcbiAgICAvLyAtIGFsbCBVUkxzIHJvdXRlZCB0aHJvdWdoIHRoZSBzaGVsbCBpbmNsdWRlcyBhIGhhc2hiYW5nICgjISksIHRoZSBzaGVsbCBlbnN1cmVzXHJcbiAgICAvLyAgIHRoYXQgaGFwcGVucyBieSBhcHBlbmRpbmcgdGhlIGhhc2hiYW5nIHRvIGFueSBVUkwgcGFzc2VkIGluIChleGNlcHQgdGhlIHN0YW5kYXJkIGhhc2hcclxuICAgIC8vICAgdGhhdCBhcmUgc2tpcHQpLlxyXG4gICAgdGhpcy5mb3JjZUhhc2hiYW5nID0gc2V0dGluZ3MuZm9yY2VIYXNoYmFuZyB8fCBmYWxzZTtcclxuICAgIHRoaXMubGlua0V2ZW50ID0gc2V0dGluZ3MubGlua0V2ZW50IHx8ICdjbGljayc7XHJcbiAgICB0aGlzLnBhcnNlVXJsID0gKHNldHRpbmdzLnBhcnNlVXJsIHx8IGRlcHMucGFyc2VVcmwpLmJpbmQodGhpcywgdGhpcy5iYXNlVXJsKTtcclxuICAgIHRoaXMuYWJzb2x1dGl6ZVVybCA9IChzZXR0aW5ncy5hYnNvbHV0aXplVXJsIHx8IGRlcHMuYWJzb2x1dGl6ZVVybCkuYmluZCh0aGlzLCB0aGlzLmJhc2VVcmwpO1xyXG5cclxuICAgIHRoaXMuaGlzdG9yeSA9IHNldHRpbmdzLmhpc3RvcnkgfHwgd2luZG93Lmhpc3Rvcnk7XHJcblxyXG4gICAgdGhpcy5pbmRleE5hbWUgPSBzZXR0aW5ncy5pbmRleE5hbWUgfHwgJ2luZGV4JztcclxuICAgIFxyXG4gICAgdGhpcy5pdGVtcyA9IHNldHRpbmdzLmRvbUl0ZW1zTWFuYWdlcjtcclxuXHJcbiAgICAvLyBsb2FkZXIgY2FuIGJlIGRpc2FibGVkIHBhc3NpbmcgJ251bGwnLCBzbyB3ZSBtdXN0XHJcbiAgICAvLyBlbnN1cmUgdG8gbm90IHVzZSB0aGUgZGVmYXVsdCBvbiB0aGF0IGNhc2VzOlxyXG4gICAgdGhpcy5sb2FkZXIgPSB0eXBlb2Yoc2V0dGluZ3MubG9hZGVyKSA9PT0gJ3VuZGVmaW5lZCcgPyBkZXBzLmxvYWRlciA6IHNldHRpbmdzLmxvYWRlcjtcclxuICAgIC8vIGxvYWRlciBzZXR1cFxyXG4gICAgaWYgKHRoaXMubG9hZGVyKVxyXG4gICAgICAgIHRoaXMubG9hZGVyLmJhc2VVcmwgPSB0aGlzLmJhc2VVcmw7XHJcblxyXG4gICAgLy8gRGVmaW5pdGlvbiBvZiBldmVudHMgdGhhdCB0aGlzIG9iamVjdCBjYW4gdHJpZ2dlcixcclxuICAgIC8vIGl0cyB2YWx1ZSBjYW4gYmUgY3VzdG9taXplZCBidXQgYW55IGxpc3RlbmVyIG5lZWRzXHJcbiAgICAvLyB0byBrZWVwIHVwZGF0ZWQgdG8gdGhlIGNvcnJlY3QgZXZlbnQgc3RyaW5nLW5hbWUgdXNlZC5cclxuICAgIC8vIFRoZSBpdGVtcyBtYW5pcHVsYXRpb24gZXZlbnRzIE1VU1QgYmUgdHJpZ2dlcmVkXHJcbiAgICAvLyBieSB0aGUgJ2l0ZW1zLnN3aXRjaCcgZnVuY3Rpb25cclxuICAgIHRoaXMuZXZlbnRzID0ge1xyXG4gICAgICAgIHdpbGxPcGVuOiAnc2hlbGwtd2lsbC1vcGVuJyxcclxuICAgICAgICB3aWxsQ2xvc2U6ICdzaGVsbC13aWxsLWNsb3NlJyxcclxuICAgICAgICBpdGVtUmVhZHk6ICdzaGVsbC1pdGVtLXJlYWR5JyxcclxuICAgICAgICBjbG9zZWQ6ICdzaGVsbC1jbG9zZWQnLFxyXG4gICAgICAgIG9wZW5lZDogJ3NoZWxsLW9wZW5lZCdcclxuICAgIH07XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEEgZnVuY3Rpb24gdG8gZGVjaWRlIGlmIHRoZVxyXG4gICAgICAgIGFjY2VzcyBpcyBhbGxvd2VkIChyZXR1cm5zICdudWxsJylcclxuICAgICAgICBvciBub3QgKHJldHVybiBhIHN0YXRlIG9iamVjdCB3aXRoIGluZm9ybWF0aW9uXHJcbiAgICAgICAgdGhhdCB3aWxsIGJlIHBhc3NlZCB0byB0aGUgJ25vbkFjY2Vzc05hbWUnIGl0ZW07XHJcbiAgICAgICAgdGhlICdyb3V0ZScgcHJvcGVydHkgb24gdGhlIHN0YXRlIGlzIGF1dG9tYXRpY2FsbHkgZmlsbGVkKS5cclxuICAgICAgICBcclxuICAgICAgICBUaGUgZGVmYXVsdCBidWl0LWluIGp1c3QgYWxsb3cgZXZlcnl0aGluZyBcclxuICAgICAgICBieSBqdXN0IHJldHVybmluZyAnbnVsbCcgYWxsIHRoZSB0aW1lLlxyXG4gICAgICAgIFxyXG4gICAgICAgIEl0IHJlY2VpdmVzIGFzIHBhcmFtZXRlciB0aGUgc3RhdGUgb2JqZWN0LFxyXG4gICAgICAgIHRoYXQgYWxtb3N0IGNvbnRhaW5zIHRoZSAncm91dGUnIHByb3BlcnR5IHdpdGhcclxuICAgICAgICBpbmZvcm1hdGlvbiBhYm91dCB0aGUgVVJMLlxyXG4gICAgKiovXHJcbiAgICB0aGlzLmFjY2Vzc0NvbnRyb2wgPSBzZXR0aW5ncy5hY2Nlc3NDb250cm9sIHx8IGRlcHMuYWNjZXNzQ29udHJvbDtcclxuICAgIC8vIFdoYXQgaXRlbSBsb2FkIG9uIG5vbiBhY2Nlc3NcclxuICAgIHRoaXMubm9uQWNjZXNzTmFtZSA9IHNldHRpbmdzLm5vbkFjY2Vzc05hbWUgfHwgJ2luZGV4JztcclxufVxyXG5cclxuLy8gU2hlbGwgaW5oZXJpdHMgZnJvbSBFdmVudEVtaXR0ZXJcclxuU2hlbGwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShkZXBzLkV2ZW50RW1pdHRlci5wcm90b3R5cGUsIHtcclxuICAgIGNvbnN0cnVjdG9yOiB7XHJcbiAgICAgICAgdmFsdWU6IFNoZWxsLFxyXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxyXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2hlbGw7XHJcblxyXG5cclxuLyoqIEFQSSBkZWZpbml0aW9uICoqL1xyXG5cclxuU2hlbGwucHJvdG90eXBlLmdvID0gZnVuY3Rpb24gZ28odXJsLCBzdGF0ZSkge1xyXG5cclxuICAgIGlmICh0aGlzLmZvcmNlSGFzaGJhbmcpIHtcclxuICAgICAgICBpZiAoIS9eIyEvLnRlc3QodXJsKSkge1xyXG4gICAgICAgICAgICB1cmwgPSAnIyEnICsgdXJsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHVybCA9IHRoaXMuYWJzb2x1dGl6ZVVybCh1cmwpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5oaXN0b3J5LnB1c2hTdGF0ZShzdGF0ZSwgdW5kZWZpbmVkLCB1cmwpO1xyXG4gICAgLy8gcHVzaFN0YXRlIGRvIE5PVCB0cmlnZ2VyIHRoZSBwb3BzdGF0ZSBldmVudCwgc29cclxuICAgIHJldHVybiB0aGlzLnJlcGxhY2Uoc3RhdGUpO1xyXG59O1xyXG5cclxuU2hlbGwucHJvdG90eXBlLmdvQmFjayA9IGZ1bmN0aW9uIGdvQmFjayhzdGF0ZSwgc3RlcHMpIHtcclxuICAgIHN0ZXBzID0gMCAtIChzdGVwcyB8fCAxKTtcclxuICAgIC8vIElmIHRoZXJlIGlzIG5vdGhpbmcgdG8gZ28tYmFjayBvciBub3QgZW5vdWdodFxyXG4gICAgLy8gJ2JhY2snIHN0ZXBzLCBnbyB0byB0aGUgaW5kZXhcclxuICAgIGlmIChzdGVwcyA8IDAgJiYgTWF0aC5hYnMoc3RlcHMpID49IHRoaXMuaGlzdG9yeS5sZW5ndGgpIHtcclxuICAgICAgICB0aGlzLmdvKHRoaXMuaW5kZXhOYW1lKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIC8vIE9uIHJlcGxhY2UsIHRoZSBwYXNzZWQgc3RhdGUgaXMgbWVyZ2VkIHdpdGhcclxuICAgICAgICAvLyB0aGUgb25lIHRoYXQgY29tZXMgZnJvbSB0aGUgc2F2ZWQgaGlzdG9yeVxyXG4gICAgICAgIC8vIGVudHJ5IChpdCAncG9wcycgd2hlbiBkb2luZyB0aGUgaGlzdG9yeS5nbygpKVxyXG4gICAgICAgIHRoaXMuX3BlbmRpbmdTdGF0ZVVwZGF0ZSA9IHN0YXRlO1xyXG4gICAgICAgIHRoaXMuaGlzdG9yeS5nbyhzdGVwcyk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICAgIFByb2Nlc3MgdGhlIGdpdmVuIHN0YXRlIGluIG9yZGVyIHRvIGdldCB0aGUgY3VycmVudCBzdGF0ZVxyXG4gICAgYmFzZWQgb24gdGhhdCBvciB0aGUgc2F2ZWQgaW4gaGlzdG9yeSwgbWVyZ2UgaXQgd2l0aFxyXG4gICAgYW55IHVwZGF0ZWQgc3RhdGUgcGVuZGluZyBhbmQgYWRkcyB0aGUgcm91dGUgaW5mb3JtYXRpb24sXHJcbiAgICByZXR1cm5pbmcgYW4gc3RhdGUgb2JqZWN0IHN1aXRhYmxlIHRvIHVzZS5cclxuKiovXHJcblNoZWxsLnByb3RvdHlwZS5nZXRVcGRhdGVkU3RhdGUgPSBmdW5jdGlvbiBnZXRVcGRhdGVkU3RhdGUoc3RhdGUpIHtcclxuICAgIC8qanNoaW50IG1heGNvbXBsZXhpdHk6IDggKi9cclxuICAgIFxyXG4gICAgLy8gRm9yIGN1cnJlbnQgdXNlcywgYW55IHBlbmRpbmdTdGF0ZVVwZGF0ZSBpcyB1c2VkIGFzXHJcbiAgICAvLyB0aGUgc3RhdGUsIHJhdGhlciB0aGFuIHRoZSBwcm92aWRlZCBvbmVcclxuICAgIHN0YXRlID0gdGhpcy5fcGVuZGluZ1N0YXRlVXBkYXRlIHx8IHN0YXRlIHx8IHRoaXMuaGlzdG9yeS5zdGF0ZSB8fCB7fTtcclxuICAgIFxyXG4gICAgLy8gVE9ETzogbW9yZSBhZHZhbmNlZCB1c2VzIG11c3QgYmUgdG8gdXNlIHRoZSAnc3RhdGUnIHRvXHJcbiAgICAvLyByZWNvdmVyIHRoZSBVSSBzdGF0ZSwgd2l0aCBhbnkgbWVzc2FnZSBmcm9tIG90aGVyIFVJXHJcbiAgICAvLyBwYXNzaW5nIGluIGEgd2F5IHRoYXQgYWxsb3cgdXBkYXRlIHRoZSBzdGF0ZSwgbm90XHJcbiAgICAvLyByZXBsYWNlIGl0IChmcm9tIHBlbmRpbmdTdGF0ZVVwZGF0ZSkuXHJcbiAgICAvKlxyXG4gICAgLy8gU3RhdGUgb3IgZGVmYXVsdCBzdGF0ZVxyXG4gICAgc3RhdGUgPSBzdGF0ZSB8fCB0aGlzLmhpc3Rvcnkuc3RhdGUgfHwge307XHJcbiAgICAvLyBtZXJnZSBwZW5kaW5nIHVwZGF0ZWQgc3RhdGVcclxuICAgIHRoaXMuJC5leHRlbmQoc3RhdGUsIHRoaXMuX3BlbmRpbmdTdGF0ZVVwZGF0ZSk7XHJcbiAgICAvLyBkaXNjYXJkIHRoZSB1cGRhdGVcclxuICAgICovXHJcbiAgICB0aGlzLl9wZW5kaW5nU3RhdGVVcGRhdGUgPSBudWxsO1xyXG4gICAgXHJcbiAgICAvLyBEb2Vzbid0IG1hdHRlcnMgaWYgc3RhdGUgaW5jbHVkZXMgYWxyZWFkeSBcclxuICAgIC8vICdyb3V0ZScgaW5mb3JtYXRpb24sIG5lZWQgdG8gYmUgb3ZlcndyaXR0ZW5cclxuICAgIC8vIHRvIG1hdGNoIHRoZSBjdXJyZW50IG9uZS5cclxuICAgIC8vIE5PVEU6IHByZXZpb3VzbHksIGEgY2hlY2sgcHJldmVudGVkIHRoaXMgaWZcclxuICAgIC8vIHJvdXRlIHByb3BlcnR5IGV4aXN0cywgY3JlYXRpbmcgaW5maW5pdGUgbG9vcHNcclxuICAgIC8vIG9uIHJlZGlyZWN0aW9ucyBmcm9tIGFjdGl2aXR5LnNob3cgc2luY2UgJ3JvdXRlJyBkb2Vzbid0XHJcbiAgICAvLyBtYXRjaCB0aGUgbmV3IGRlc2lyZWQgbG9jYXRpb25cclxuICAgIFxyXG4gICAgLy8gRGV0ZWN0IGlmIGlzIGEgaGFzaGJhbmcgVVJMIG9yIGFuIHN0YW5kYXJkIG9uZS5cclxuICAgIC8vIEV4Y2VwdCBpZiB0aGUgYXBwIGlzIGZvcmNlZCB0byB1c2UgaGFzaGJhbmcuXHJcbiAgICB2YXIgaXNIYXNoQmFuZyA9IC8jIS8udGVzdChsb2NhdGlvbi5ocmVmKSB8fCB0aGlzLmZvcmNlSGFzaGJhbmc7XHJcbiAgICBcclxuICAgIHZhciBsaW5rID0gKFxyXG4gICAgICAgIGlzSGFzaEJhbmcgP1xyXG4gICAgICAgIGxvY2F0aW9uLmhhc2ggOlxyXG4gICAgICAgIGxvY2F0aW9uLnBhdGhuYW1lXHJcbiAgICApICsgKGxvY2F0aW9uLnNlYXJjaCB8fCAnJyk7XHJcbiAgICBcclxuICAgIC8vIFNldCB0aGUgcm91dGVcclxuICAgIHN0YXRlLnJvdXRlID0gdGhpcy5wYXJzZVVybChsaW5rKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHN0YXRlO1xyXG59O1xyXG5cclxuU2hlbGwucHJvdG90eXBlLnJlcGxhY2UgPSBmdW5jdGlvbiByZXBsYWNlKHN0YXRlKSB7XHJcbiAgICBcclxuICAgIHN0YXRlID0gdGhpcy5nZXRVcGRhdGVkU3RhdGUoc3RhdGUpO1xyXG5cclxuICAgIC8vIFVzZSB0aGUgaW5kZXggb24gcm9vdCBjYWxsc1xyXG4gICAgaWYgKHN0YXRlLnJvdXRlLnJvb3QgPT09IHRydWUpIHtcclxuICAgICAgICBzdGF0ZS5yb3V0ZSA9IHRoaXMucGFyc2VVcmwodGhpcy5pbmRleE5hbWUpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBBY2Nlc3MgY29udHJvbFxyXG4gICAgdmFyIGFjY2Vzc0Vycm9yID0gdGhpcy5hY2Nlc3NDb250cm9sKHN0YXRlLnJvdXRlKTtcclxuICAgIGlmIChhY2Nlc3NFcnJvcikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdvKHRoaXMubm9uQWNjZXNzTmFtZSwgYWNjZXNzRXJyb3IpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIExvY2F0aW5nIHRoZSBjb250YWluZXJcclxuICAgIHZhciAkY29udCA9IHRoaXMuaXRlbXMuZmluZChzdGF0ZS5yb3V0ZS5uYW1lKTtcclxuICAgIHZhciBzaGVsbCA9IHRoaXM7XHJcbiAgICB2YXIgcHJvbWlzZSA9IG51bGw7XHJcblxyXG4gICAgaWYgKCRjb250ICYmICRjb250Lmxlbmd0aCkge1xyXG4gICAgICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgJG9sZENvbnQgPSBzaGVsbC5pdGVtcy5nZXRBY3RpdmUoKTtcclxuICAgICAgICAgICAgICAgICRvbGRDb250ID0gJG9sZENvbnQubm90KCRjb250KTtcclxuICAgICAgICAgICAgICAgIHNoZWxsLml0ZW1zLnN3aXRjaCgkb2xkQ29udCwgJGNvbnQsIHNoZWxsLCBzdGF0ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpOyAvLz8gcmVzb2x2ZShhY3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGV4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgaWYgKHRoaXMubG9hZGVyKSB7XHJcbiAgICAgICAgICAgIC8vIGxvYWQgYW5kIGluamVjdCB0aGUgY29udGVudCBpbiB0aGUgcGFnZVxyXG4gICAgICAgICAgICAvLyB0aGVuIHRyeSB0aGUgcmVwbGFjZSBhZ2FpblxyXG4gICAgICAgICAgICBwcm9taXNlID0gdGhpcy5sb2FkZXIubG9hZChzdGF0ZS5yb3V0ZSkudGhlbihmdW5jdGlvbihodG1sKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgdG8gdGhlIGl0ZW1zICh0aGUgbWFuYWdlciB0YWtlcyBjYXJlIHlvdVxyXG4gICAgICAgICAgICAgICAgLy8gYWRkIG9ubHkgdGhlIGl0ZW0sIGlmIHRoZXJlIGlzIG9uZSlcclxuICAgICAgICAgICAgICAgIHNoZWxsLml0ZW1zLmluamVjdChzdGF0ZS5yb3V0ZS5uYW1lLCBodG1sKTtcclxuICAgICAgICAgICAgICAgIC8vIERvdWJsZSBjaGVjayB0aGF0IHRoZSBpdGVtIHdhcyBhZGRlZCBhbmQgaXMgcmVhZHlcclxuICAgICAgICAgICAgICAgIC8vIHRvIGF2b2lkIGFuIGluZmluaXRlIGxvb3AgYmVjYXVzZSBhIHJlcXVlc3Qgbm90IHJldHVybmluZ1xyXG4gICAgICAgICAgICAgICAgLy8gdGhlIGl0ZW0gYW5kIHRoZSAncmVwbGFjZScgdHJ5aW5nIHRvIGxvYWQgaXQgYWdhaW4sIGFuZCBhZ2FpbiwgYW5kLi5cclxuICAgICAgICAgICAgICAgIGlmIChzaGVsbC5pdGVtcy5maW5kKHN0YXRlLnJvdXRlLm5hbWUpLmxlbmd0aClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2hlbGwucmVwbGFjZShzdGF0ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcignUGFnZSBub3QgZm91bmQgKCcgKyBzdGF0ZS5yb3V0ZS5uYW1lICsgJyknKTtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdTaGVsbCBQYWdlIG5vdCBmb3VuZCwgc3RhdGU6Jywgc3RhdGUpO1xyXG4gICAgICAgICAgICBwcm9taXNlID0gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFRvIGF2b2lkIGJlaW5nIGluIGFuIGluZXhpc3RhbnQgVVJMIChnZW5lcmF0aW5nIGluY29uc2lzdGVuY3kgYmV0d2VlblxyXG4gICAgICAgICAgICAvLyBjdXJyZW50IHZpZXcgYW5kIFVSTCwgY3JlYXRpbmcgYmFkIGhpc3RvcnkgZW50cmllcyksXHJcbiAgICAgICAgICAgIC8vIGEgZ29CYWNrIGlzIGV4ZWN1dGVkLCBqdXN0IGFmdGVyIHRoZSBjdXJyZW50IHBpcGUgZW5kc1xyXG4gICAgICAgICAgICAvLyBUT0RPOiBpbXBsZW1lbnQgcmVkaXJlY3QgdGhhdCBjdXQgY3VycmVudCBwcm9jZXNzaW5nIHJhdGhlciB0aGFuIGV4ZWN1dGUgZGVsYXllZFxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nb0JhY2soKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHZhciB0aGlzU2hlbGwgPSB0aGlzO1xyXG4gICAgcHJvbWlzZS5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiBFcnJvcikpXHJcbiAgICAgICAgICAgIGVyciA9IG5ldyBFcnJvcihlcnIpO1xyXG5cclxuICAgICAgICAvLyBMb2cgZXJyb3IsIFxyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1NoZWxsLCB1bmV4cGVjdGVkIGVycm9yLicsIGVycik7XHJcbiAgICAgICAgLy8gbm90aWZ5IGFzIGFuIGV2ZW50XHJcbiAgICAgICAgdGhpc1NoZWxsLmVtaXQoJ2Vycm9yJywgZXJyKTtcclxuICAgICAgICAvLyBhbmQgY29udGludWUgcHJvcGFnYXRpbmcgdGhlIGVycm9yXHJcbiAgICAgICAgcmV0dXJuIGVycjtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBwcm9taXNlO1xyXG59O1xyXG5cclxuU2hlbGwucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIHJ1bigpIHtcclxuXHJcbiAgICB2YXIgc2hlbGwgPSB0aGlzO1xyXG5cclxuICAgIC8vIENhdGNoIHBvcHN0YXRlIGV2ZW50IHRvIHVwZGF0ZSBzaGVsbCByZXBsYWNpbmcgdGhlIGFjdGl2ZSBjb250YWluZXIuXHJcbiAgICAvLyBBbGxvd3MgcG9seWZpbGxzIHRvIHByb3ZpZGUgYSBkaWZmZXJlbnQgYnV0IGVxdWl2YWxlbnQgZXZlbnQgbmFtZVxyXG4gICAgdGhpcy4kKHdpbmRvdykub24odGhpcy5oaXN0b3J5LnBvcHN0YXRlRXZlbnQgfHwgJ3BvcHN0YXRlJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgc3RhdGUgPSBldmVudC5zdGF0ZSB8fCBcclxuICAgICAgICAgICAgKGV2ZW50Lm9yaWdpbmFsRXZlbnQgJiYgZXZlbnQub3JpZ2luYWxFdmVudC5zdGF0ZSkgfHwgXHJcbiAgICAgICAgICAgIHNoZWxsLmhpc3Rvcnkuc3RhdGU7XHJcblxyXG4gICAgICAgIC8vIGdldCBzdGF0ZSBmb3IgY3VycmVudC4gVG8gc3VwcG9ydCBwb2x5ZmlsbHMsIHdlIHVzZSB0aGUgZ2VuZXJhbCBnZXR0ZXJcclxuICAgICAgICAvLyBoaXN0b3J5LnN0YXRlIGFzIGZhbGxiYWNrICh0aGV5IG11c3QgYmUgdGhlIHNhbWUgb24gYnJvd3NlcnMgc3VwcG9ydGluZyBIaXN0b3J5IEFQSSlcclxuICAgICAgICBzaGVsbC5yZXBsYWNlKHN0YXRlKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENhdGNoIGFsbCBsaW5rcyBpbiB0aGUgcGFnZSAobm90IG9ubHkgJHJvb3Qgb25lcykgYW5kIGxpa2UtbGlua3NcclxuICAgIHRoaXMuJChkb2N1bWVudCkub24odGhpcy5saW5rRXZlbnQsICdbaHJlZl0sIFtkYXRhLWhyZWZdJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciAkdCA9IHNoZWxsLiQodGhpcyksXHJcbiAgICAgICAgICAgIGhyZWYgPSAkdC5hdHRyKCdocmVmJykgfHwgJHQuZGF0YSgnaHJlZicpO1xyXG5cclxuICAgICAgICAvLyBEbyBub3RoaW5nIGlmIHRoZSBVUkwgY29udGFpbnMgdGhlIHByb3RvY29sXHJcbiAgICAgICAgaWYgKC9eW2Etel0rOi9pLnRlc3QoaHJlZikpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChzaGVsbC5mb3JjZUhhc2hiYW5nICYmIC9eIyhbXiFdfCQpLy50ZXN0KGhyZWYpKSB7XHJcbiAgICAgICAgICAgIC8vIFN0YW5kYXJkIGhhc2gsIGJ1dCBub3QgaGFzaGJhbmc6IGF2b2lkIHJvdXRpbmcgYW5kIGRlZmF1bHQgYmVoYXZpb3JcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgLy8/IGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgIC8vIEV4ZWN1dGVkIGRlbGF5ZWQgdG8gYXZvaWQgaGFuZGxlciBjb2xsaXNpb25zLCBiZWNhdXNlXHJcbiAgICAgICAgLy8gb2YgdGhlIG5ldyBwYWdlIG1vZGlmeWluZyB0aGUgZWxlbWVudCBhbmQgb3RoZXIgaGFuZGxlcnNcclxuICAgICAgICAvLyByZWFkaW5nIGl0IGF0dHJpYnV0ZXMgYW5kIGFwcGx5aW5nIGxvZ2ljIG9uIHRoZSB1cGRhdGVkIGxpbmtcclxuICAgICAgICAvLyBhcyBpZiB3YXMgdGhlIG9sZCBvbmUgKGV4YW1wbGU6IHNoYXJlZCBsaW5rcywgbGlrZSBpbiBhXHJcbiAgICAgICAgLy8gZ2xvYmFsIG5hdmJhciwgdGhhdCBtb2RpZmllcyB3aXRoIHRoZSBuZXcgcGFnZSkuXHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgc2hlbGwuZ28oaHJlZik7XHJcbiAgICAgICAgfSwgMSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBJbml0aWFsbGl6ZSBzdGF0ZVxyXG4gICAgdGhpcy5pdGVtcy5pbml0KCk7XHJcbiAgICAvLyBSb3V0ZSB0byB0aGUgY3VycmVudCB1cmwvc3RhdGVcclxuICAgIHRoaXMucmVwbGFjZSgpO1xyXG59O1xyXG4iLCIvKipcclxuICAgIGFic29sdXRpemVVcmwgdXRpbGl0eSBcclxuICAgIHRoYXQgZW5zdXJlcyB0aGUgdXJsIHByb3ZpZGVkXHJcbiAgICBiZWluZyBpbiB0aGUgcGF0aCBvZiB0aGUgZ2l2ZW4gYmFzZVVybFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIHNhbml0aXplVXJsID0gcmVxdWlyZSgnLi9zYW5pdGl6ZVVybCcpLFxyXG4gICAgZXNjYXBlUmVnRXhwID0gcmVxdWlyZSgnLi4vZXNjYXBlUmVnRXhwJyk7XHJcblxyXG5mdW5jdGlvbiBhYnNvbHV0aXplVXJsKGJhc2VVcmwsIHVybCkge1xyXG5cclxuICAgIC8vIHNhbml0aXplIGJlZm9yZSBjaGVja1xyXG4gICAgdXJsID0gc2FuaXRpemVVcmwodXJsKTtcclxuXHJcbiAgICAvLyBDaGVjayBpZiB1c2UgdGhlIGJhc2UgYWxyZWFkeVxyXG4gICAgdmFyIG1hdGNoQmFzZSA9IG5ldyBSZWdFeHAoJ14nICsgZXNjYXBlUmVnRXhwKGJhc2VVcmwpLCAnaScpO1xyXG4gICAgaWYgKG1hdGNoQmFzZS50ZXN0KHVybCkpIHtcclxuICAgICAgICByZXR1cm4gdXJsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGJ1aWxkIGFuZCBzYW5pdGl6ZVxyXG4gICAgcmV0dXJuIHNhbml0aXplVXJsKGJhc2VVcmwgKyB1cmwpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFic29sdXRpemVVcmw7XHJcbiIsIi8qKlxyXG4gICAgRXh0ZXJuYWwgZGVwZW5kZW5jaWVzIGZvciBTaGVsbCBpbiBhIHNlcGFyYXRlIG1vZHVsZVxyXG4gICAgdG8gdXNlIGFzIERJLCBuZWVkcyBzZXR1cCBiZWZvcmUgY2FsbCB0aGUgU2hlbGwuanNcclxuICAgIG1vZHVsZSBjbGFzc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBwYXJzZVVybDogbnVsbCxcclxuICAgIGFic29sdXRpemVVcmw6IG51bGwsXHJcbiAgICBqcXVlcnk6IG51bGwsXHJcbiAgICBsb2FkZXI6IG51bGwsXHJcbiAgICBhY2Nlc3NDb250cm9sOiBmdW5jdGlvbiBhbGxvd0FsbCgvKm5hbWUqLykge1xyXG4gICAgICAgIC8vIGFsbG93IGFjY2VzcyBieSBkZWZhdWx0XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9LFxyXG4gICAgRXZlbnRFbWl0dGVyOiBudWxsXHJcbn07XHJcbiIsIi8qKlxyXG4gICAgU2ltcGxlIGltcGxlbWVudGF0aW9uIG9mIHRoZSBIaXN0b3J5IEFQSSB1c2luZyBvbmx5IGhhc2hiYW5ncyBVUkxzLFxyXG4gICAgZG9lc24ndCBtYXR0ZXJzIHRoZSBicm93c2VyIHN1cHBvcnQuXHJcbiAgICBVc2VkIHRvIGF2b2lkIGZyb20gc2V0dGluZyBVUkxzIHRoYXQgaGFzIG5vdCBhbiBlbmQtcG9pbnQsXHJcbiAgICBsaWtlIGluIGxvY2FsIGVudmlyb25tZW50cyB3aXRob3V0IGEgc2VydmVyIGRvaW5nIHVybC1yZXdyaXRpbmcsXHJcbiAgICBpbiBwaG9uZWdhcCBhcHBzLCBvciB0byBjb21wbGV0ZWx5IGJ5LXBhc3MgYnJvd3NlciBzdXBwb3J0IGJlY2F1c2VcclxuICAgIGlzIGJ1Z2d5IChsaWtlIEFuZHJvaWQgPD0gNC4xKS5cclxuICAgIFxyXG4gICAgTk9URVM6XHJcbiAgICAtIEJyb3dzZXIgbXVzdCBzdXBwb3J0ICdoYXNoY2hhbmdlJyBldmVudC5cclxuICAgIC0gQnJvd3NlciBtdXN0IGhhcyBzdXBwb3J0IGZvciBzdGFuZGFyZCBKU09OIGNsYXNzLlxyXG4gICAgLSBSZWxpZXMgb24gc2Vzc2lvbnN0b3JhZ2UgZm9yIHBlcnNpc3RhbmNlLCBzdXBwb3J0ZWQgYnkgYWxsIGJyb3dzZXJzIGFuZCB3ZWJ2aWV3cyBcclxuICAgICAgZm9yIGEgZW5vdWdoIGxvbmcgdGltZSBub3cuXHJcbiAgICAtIFNpbWlsYXIgYXBwcm9hY2ggYXMgSGlzdG9yeS5qcyBwb2x5ZmlsbCwgYnV0IHNpbXBsaWZpZWQsIGFwcGVuZGluZyBhIGZha2UgcXVlcnlcclxuICAgICAgcGFyYW1ldGVyICdfc3VpZD0wJyB0byB0aGUgaGFzaCB2YWx1ZSAoYWN0dWFsIHF1ZXJ5IGdvZXMgYmVmb3JlIHRoZSBoYXNoLCBidXRcclxuICAgICAgd2UgbmVlZCBpdCBpbnNpZGUpLlxyXG4gICAgLSBGb3Igc2ltcGxpZmljYXRpb24sIG9ubHkgdGhlIHN0YXRlIGlzIHBlcnNpc3RlZCwgdGhlICd0aXRsZScgcGFyYW1ldGVyIGlzIG5vdFxyXG4gICAgICB1c2VkIGF0IGFsbCAodGhlIHNhbWUgYXMgbWFqb3IgYnJvd3NlcnMgZG8sIHNvIGlzIG5vdCBhIHByb2JsZW0pOyBpbiB0aGlzIGxpbmUsXHJcbiAgICAgIG9ubHkgaGlzdG9yeSBlbnRyaWVzIHdpdGggc3RhdGUgYXJlIHBlcnNpc3RlZC5cclxuKiovXHJcbi8vZ2xvYmFsIGxvY2F0aW9uXHJcbid1c2Ugc3RyaWN0JztcclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHNhbml0aXplVXJsID0gcmVxdWlyZSgnLi9zYW5pdGl6ZVVybCcpLFxyXG4gICAgZ2V0VXJsUXVlcnkgPSByZXF1aXJlKCcuLi9nZXRVcmxRdWVyeScpO1xyXG5cclxuLy8gSW5pdDogTG9hZCBzYXZlZCBjb3B5IGZyb20gc2Vzc2lvblN0b3JhZ2VcclxudmFyIHNlc3Npb24gPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKCdoYXNoYmFuZ0hpc3Rvcnkuc3RvcmUnKTtcclxuLy8gT3IgY3JlYXRlIGEgbmV3IG9uZVxyXG5pZiAoIXNlc3Npb24pIHtcclxuICAgIHNlc3Npb24gPSB7XHJcbiAgICAgICAgLy8gU3RhdGVzIGFycmF5IHdoZXJlIGVhY2ggaW5kZXggaXMgdGhlIFNVSUQgY29kZSBhbmQgdGhlXHJcbiAgICAgICAgLy8gdmFsdWUgaXMganVzdCB0aGUgdmFsdWUgcGFzc2VkIGFzIHN0YXRlIG9uIHB1c2hTdGF0ZS9yZXBsYWNlU3RhdGVcclxuICAgICAgICBzdGF0ZXM6IFtdXHJcbiAgICB9O1xyXG59XHJcbmVsc2Uge1xyXG4gICAgc2Vzc2lvbiA9IEpTT04ucGFyc2Uoc2Vzc2lvbik7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICAgIEdldCB0aGUgU1VJRCBudW1iZXJcclxuICAgIGZyb20gYSBoYXNoIHN0cmluZ1xyXG4qKi9cclxuZnVuY3Rpb24gZ2V0U3VpZChoYXNoKSB7XHJcbiAgICBcclxuICAgIHZhciBzdWlkID0gK2dldFVybFF1ZXJ5KGhhc2gpLl9zdWlkO1xyXG4gICAgaWYgKGlzTmFOKHN1aWQpKVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIHJldHVybiBzdWlkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRTdWlkKGhhc2gsIHN1aWQpIHtcclxuICAgIFxyXG4gICAgLy8gV2UgbmVlZCB0aGUgcXVlcnksIHNpbmNlIHdlIG5lZWQgXHJcbiAgICAvLyB0byByZXBsYWNlIHRoZSBfc3VpZCAobWF5IGV4aXN0KVxyXG4gICAgLy8gYW5kIHJlY3JlYXRlIHRoZSBxdWVyeSBpbiB0aGVcclxuICAgIC8vIHJldHVybmVkIGhhc2gtdXJsXHJcbiAgICB2YXIgcXMgPSBnZXRVcmxRdWVyeShoYXNoKTtcclxuICAgIHFzLnB1c2goJ19zdWlkJyk7XHJcbiAgICBxcy5fc3VpZCA9IHN1aWQ7XHJcblxyXG4gICAgdmFyIHF1ZXJ5ID0gW107XHJcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgcXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBxdWVyeS5wdXNoKHFzW2ldICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHFzW3FzW2ldXSkpO1xyXG4gICAgfVxyXG4gICAgcXVlcnkgPSBxdWVyeS5qb2luKCcmJyk7XHJcbiAgICBcclxuICAgIGlmIChxdWVyeSkge1xyXG4gICAgICAgIHZhciBpbmRleCA9IGhhc2guaW5kZXhPZignPycpO1xyXG4gICAgICAgIGlmIChpbmRleCA+IC0xKVxyXG4gICAgICAgICAgICBoYXNoID0gaGFzaC5zdWJzdHIoMCwgaW5kZXgpO1xyXG4gICAgICAgIGhhc2ggKz0gJz8nICsgcXVlcnk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGhhc2g7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgQXNrIHRvIHBlcnNpc3QgdGhlIHNlc3Npb24gZGF0YS5cclxuICAgIEl0IGlzIGRvbmUgd2l0aCBhIHRpbWVvdXQgaW4gb3JkZXIgdG8gYXZvaWRcclxuICAgIGRlbGF5IGluIHRoZSBjdXJyZW50IHRhc2sgbWFpbmx5IGFueSBoYW5kbGVyXHJcbiAgICB0aGF0IGFjdHMgYWZ0ZXIgYSBIaXN0b3J5IGNoYW5nZS5cclxuKiovXHJcbmZ1bmN0aW9uIHBlcnNpc3QoKSB7XHJcbiAgICAvLyBFbm91Z2ggdGltZSB0byBhbGxvdyByb3V0aW5nIHRhc2tzLFxyXG4gICAgLy8gbW9zdCBhbmltYXRpb25zIGZyb20gZmluaXNoIGFuZCB0aGUgVUlcclxuICAgIC8vIGJlaW5nIHJlc3BvbnNpdmUuXHJcbiAgICAvLyBCZWNhdXNlIHNlc3Npb25TdG9yYWdlIGlzIHN5bmNocm9ub3VzLlxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKCdoYXNoYmFuZ0hpc3Rvcnkuc3RvcmUnLCBKU09OLnN0cmluZ2lmeShzZXNzaW9uKSk7XHJcbiAgICB9LCAxNTAwKTtcclxufVxyXG5cclxuLyoqXHJcbiAgICBSZXR1cm5zIHRoZSBnaXZlbiBzdGF0ZSBvciBudWxsXHJcbiAgICBpZiBpcyBhbiBlbXB0eSBvYmplY3QuXHJcbioqL1xyXG5mdW5jdGlvbiBjaGVja1N0YXRlKHN0YXRlKSB7XHJcbiAgICBcclxuICAgIGlmIChzdGF0ZSkge1xyXG4gICAgICAgIC8vIGlzIGVtcHR5P1xyXG4gICAgICAgIGlmIChPYmplY3Qua2V5cyhzdGF0ZSkubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAvLyBOb1xyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGl0cyBlbXB0eVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgLy8gQW55dGhpbmcgZWxzZVxyXG4gICAgcmV0dXJuIHN0YXRlO1xyXG59XHJcblxyXG4vKipcclxuICAgIEdldCBhIGNhbm9uaWNhbCByZXByZXNlbnRhdGlvblxyXG4gICAgb2YgdGhlIFVSTCBzbyBjYW4gYmUgY29tcGFyZWRcclxuICAgIHdpdGggc3VjY2Vzcy5cclxuKiovXHJcbmZ1bmN0aW9uIGNhbm5vbmljYWxVcmwodXJsKSB7XHJcbiAgICBcclxuICAgIC8vIEF2b2lkIHNvbWUgYmFkIG9yIHByb2JsZW1hdGljIHN5bnRheFxyXG4gICAgdXJsID0gc2FuaXRpemVVcmwodXJsIHx8ICcnKTtcclxuICAgIFxyXG4gICAgLy8gR2V0IHRoZSBoYXNoIHBhcnRcclxuICAgIHZhciBpaGFzaCA9IHVybC5pbmRleE9mKCcjJyk7XHJcbiAgICBpZiAoaWhhc2ggPiAtMSkge1xyXG4gICAgICAgIHVybCA9IHVybC5zdWJzdHIoaWhhc2ggKyAxKTtcclxuICAgIH1cclxuICAgIC8vIE1heWJlIGEgaGFzaGJhbmcgVVJMLCByZW1vdmUgdGhlXHJcbiAgICAvLyAnYmFuZycgKHRoZSBoYXNoIHdhcyByZW1vdmVkIGFscmVhZHkpXHJcbiAgICB1cmwgPSB1cmwucmVwbGFjZSgvXiEvLCAnJyk7XHJcblxyXG4gICAgcmV0dXJuIHVybDtcclxufVxyXG5cclxuLyoqXHJcbiAgICBUcmFja3MgdGhlIGxhdGVzdCBVUkxcclxuICAgIGJlaW5nIHB1c2hlZCBvciByZXBsYWNlZCBieVxyXG4gICAgdGhlIEFQSS5cclxuICAgIFRoaXMgYWxsb3dzIGxhdGVyIHRvIGF2b2lkXHJcbiAgICB0cmlnZ2VyIHRoZSBwb3BzdGF0ZSBldmVudCxcclxuICAgIHNpbmNlIG11c3QgTk9UIGJlIHRyaWdnZXJlZFxyXG4gICAgYXMgYSByZXN1bHQgb2YgdGhhdCBBUEkgbWV0aG9kc1xyXG4qKi9cclxudmFyIGxhdGVzdFB1c2hlZFJlcGxhY2VkVXJsID0gbnVsbDtcclxuXHJcbi8qKlxyXG4gICAgSGlzdG9yeSBQb2x5ZmlsbFxyXG4qKi9cclxudmFyIGhhc2hiYW5nSGlzdG9yeSA9IHtcclxuICAgIHB1c2hTdGF0ZTogZnVuY3Rpb24gcHVzaFN0YXRlKHN0YXRlLCB0aXRsZSwgdXJsKSB7XHJcblxyXG4gICAgICAgIC8vIGNsZWFudXAgdXJsXHJcbiAgICAgICAgdXJsID0gY2Fubm9uaWNhbFVybCh1cmwpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIHNhdmUgbmV3IHN0YXRlIGZvciB1cmxcclxuICAgICAgICBzdGF0ZSA9IGNoZWNrU3RhdGUoc3RhdGUpIHx8IG51bGw7XHJcbiAgICAgICAgaWYgKHN0YXRlICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIC8vIHNhdmUgc3RhdGVcclxuICAgICAgICAgICAgc2Vzc2lvbi5zdGF0ZXMucHVzaChzdGF0ZSk7XHJcbiAgICAgICAgICAgIHZhciBzdWlkID0gc2Vzc2lvbi5zdGF0ZXMubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgLy8gdXBkYXRlIFVSTCB3aXRoIHRoZSBzdWlkXHJcbiAgICAgICAgICAgIHVybCA9IHNldFN1aWQodXJsLCBzdWlkKTtcclxuICAgICAgICAgICAgLy8gY2FsbCB0byBwZXJzaXN0IHRoZSB1cGRhdGVkIHNlc3Npb25cclxuICAgICAgICAgICAgcGVyc2lzdCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBsYXRlc3RQdXNoZWRSZXBsYWNlZFVybCA9IHVybDtcclxuICAgICAgICBcclxuICAgICAgICAvLyB1cGRhdGUgbG9jYXRpb24gdG8gdHJhY2sgaGlzdG9yeTpcclxuICAgICAgICBsb2NhdGlvbi5oYXNoID0gJyMhJyArIHVybDtcclxuICAgIH0sXHJcbiAgICByZXBsYWNlU3RhdGU6IGZ1bmN0aW9uIHJlcGxhY2VTdGF0ZShzdGF0ZSwgdGl0bGUsIHVybCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIGNsZWFudXAgdXJsXHJcbiAgICAgICAgdXJsID0gY2Fubm9uaWNhbFVybCh1cmwpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIGl0IGhhcyBzYXZlZCBzdGF0ZT9cclxuICAgICAgICB2YXIgc3VpZCA9IGdldFN1aWQodXJsKSxcclxuICAgICAgICAgICAgaGFzT2xkU3RhdGUgPSBzdWlkICE9PSBudWxsO1xyXG5cclxuICAgICAgICAvLyBzYXZlIG5ldyBzdGF0ZSBmb3IgdXJsXHJcbiAgICAgICAgc3RhdGUgPSBjaGVja1N0YXRlKHN0YXRlKSB8fCBudWxsO1xyXG4gICAgICAgIC8vIGl0cyBzYXZlZCBpZiB0aGVyZSBpcyBzb21ldGhpbmcgdG8gc2F2ZVxyXG4gICAgICAgIC8vIG9yIHNvbWV0aGluZyB0byBkZXN0cm95XHJcbiAgICAgICAgaWYgKHN0YXRlICE9PSBudWxsIHx8IGhhc09sZFN0YXRlKSB7XHJcbiAgICAgICAgICAgIC8vIHNhdmUgc3RhdGVcclxuICAgICAgICAgICAgaWYgKGhhc09sZFN0YXRlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyByZXBsYWNlIGV4aXN0aW5nIHN0YXRlXHJcbiAgICAgICAgICAgICAgICBzZXNzaW9uLnN0YXRlc1tzdWlkXSA9IHN0YXRlO1xyXG4gICAgICAgICAgICAgICAgLy8gdGhlIHVybCByZW1haW5zIHRoZSBzYW1lXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgc3RhdGVcclxuICAgICAgICAgICAgICAgIHNlc3Npb24uc3RhdGVzLnB1c2goc3RhdGUpO1xyXG4gICAgICAgICAgICAgICAgc3VpZCA9IHNlc3Npb24uc3RhdGVzLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgICAgICAgICAvLyB1cGRhdGUgVVJMIHdpdGggdGhlIHN1aWRcclxuICAgICAgICAgICAgICAgIHVybCA9IHNldFN1aWQodXJsLCBzdWlkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBjYWxsIHRvIHBlcnNpc3QgdGhlIHVwZGF0ZWQgc2Vzc2lvblxyXG4gICAgICAgICAgICBwZXJzaXN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxhdGVzdFB1c2hlZFJlcGxhY2VkVXJsID0gdXJsO1xyXG5cclxuICAgICAgICAvLyB1cGRhdGUgbG9jYXRpb24gdG8gdHJhY2sgaGlzdG9yeTpcclxuICAgICAgICBsb2NhdGlvbi5oYXNoID0gJyMhJyArIHVybDtcclxuICAgIH0sXHJcbiAgICBnZXQgc3RhdGUoKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHN1aWQgPSBnZXRTdWlkKGxvY2F0aW9uLmhhc2gpO1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHN1aWQgIT09IG51bGwgP1xyXG4gICAgICAgICAgICBzZXNzaW9uLnN0YXRlc1tzdWlkXSA6XHJcbiAgICAgICAgICAgIG51bGxcclxuICAgICAgICApO1xyXG4gICAgfSxcclxuICAgIGdldCBsZW5ndGgoKSB7XHJcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5oaXN0b3J5Lmxlbmd0aDtcclxuICAgIH0sXHJcbiAgICBnbzogZnVuY3Rpb24gZ28ob2Zmc2V0KSB7XHJcbiAgICAgICAgd2luZG93Lmhpc3RvcnkuZ28ob2Zmc2V0KTtcclxuICAgIH0sXHJcbiAgICBiYWNrOiBmdW5jdGlvbiBiYWNrKCkge1xyXG4gICAgICAgIHdpbmRvdy5oaXN0b3J5LmJhY2soKTtcclxuICAgIH0sXHJcbiAgICBmb3J3YXJkOiBmdW5jdGlvbiBmb3J3YXJkKCkge1xyXG4gICAgICAgIHdpbmRvdy5oaXN0b3J5LmZvcndhcmQoKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8vIEF0dGFjaCBoYXNoY2FuZ2UgZXZlbnQgdG8gdHJpZ2dlciBIaXN0b3J5IEFQSSBldmVudCAncG9wc3RhdGUnXHJcbnZhciAkdyA9ICQod2luZG93KTtcclxuJHcub24oJ2hhc2hjaGFuZ2UnLCBmdW5jdGlvbihlKSB7XHJcbiAgICBcclxuICAgIHZhciB1cmwgPSBlLm9yaWdpbmFsRXZlbnQubmV3VVJMO1xyXG4gICAgdXJsID0gY2Fubm9uaWNhbFVybCh1cmwpO1xyXG4gICAgXHJcbiAgICAvLyBBbiBVUkwgYmVpbmcgcHVzaGVkIG9yIHJlcGxhY2VkXHJcbiAgICAvLyBtdXN0IE5PVCB0cmlnZ2VyIHBvcHN0YXRlXHJcbiAgICBpZiAodXJsID09PSBsYXRlc3RQdXNoZWRSZXBsYWNlZFVybClcclxuICAgICAgICByZXR1cm47XHJcbiAgICBcclxuICAgIC8vIGdldCBzdGF0ZSBmcm9tIGhpc3RvcnkgZW50cnlcclxuICAgIC8vIGZvciB0aGUgdXBkYXRlZCBVUkwsIGlmIGFueVxyXG4gICAgLy8gKGNhbiBoYXZlIHZhbHVlIHdoZW4gdHJhdmVyc2luZ1xyXG4gICAgLy8gaGlzdG9yeSkuXHJcbiAgICB2YXIgc3VpZCA9IGdldFN1aWQodXJsKSxcclxuICAgICAgICBzdGF0ZSA9IG51bGw7XHJcbiAgICBcclxuICAgIGlmIChzdWlkICE9PSBudWxsKVxyXG4gICAgICAgIHN0YXRlID0gc2Vzc2lvbi5zdGF0ZXNbc3VpZF07XHJcblxyXG4gICAgJHcudHJpZ2dlcihuZXcgJC5FdmVudCgncG9wc3RhdGUnLCB7XHJcbiAgICAgICAgc3RhdGU6IHN0YXRlXHJcbiAgICB9KSwgJ2hhc2hiYW5nSGlzdG9yeScpO1xyXG59KTtcclxuXHJcbi8vIEZvciBIaXN0b3J5QVBJIGNhcGFibGUgYnJvd3NlcnMsIHdlIG5lZWRcclxuLy8gdG8gY2FwdHVyZSB0aGUgbmF0aXZlICdwb3BzdGF0ZScgZXZlbnQgdGhhdFxyXG4vLyBnZXRzIHRyaWdnZXJlZCBvbiBvdXIgcHVzaC9yZXBsYWNlU3RhdGUgYmVjYXVzZVxyXG4vLyBvZiB0aGUgbG9jYXRpb24gY2hhbmdlLCBidXQgdG9vIG9uIHRyYXZlcnNpbmdcclxuLy8gdGhlIGhpc3RvcnkgKGJhY2svZm9yd2FyZCkuXHJcbi8vIFdlIHdpbGwgbG9jayB0aGUgZXZlbnQgZXhjZXB0IHdoZW4gaXNcclxuLy8gdGhlIG9uZSB3ZSB0cmlnZ2VyLlxyXG4vL1xyXG4vLyBOT1RFOiB0byB0aGlzIHRyaWNrIHRvIHdvcmssIHRoaXMgbXVzdFxyXG4vLyBiZSB0aGUgZmlyc3QgaGFuZGxlciBhdHRhY2hlZCBmb3IgdGhpc1xyXG4vLyBldmVudCwgc28gY2FuIGJsb2NrIGFsbCBvdGhlcnMuXHJcbi8vIEFMVEVSTkFUSVZFOiBpbnN0ZWFkIG9mIHRoaXMsIG9uIHRoZVxyXG4vLyBwdXNoL3JlcGxhY2VTdGF0ZSBtZXRob2RzIGRldGVjdCBpZlxyXG4vLyBIaXN0b3J5QVBJIGlzIG5hdGl2ZSBzdXBwb3J0ZWQgYW5kXHJcbi8vIHVzZSByZXBsYWNlU3RhdGUgdGhlcmUgcmF0aGVyIHRoYW5cclxuLy8gYSBoYXNoIGNoYW5nZS5cclxuJHcub24oJ3BvcHN0YXRlJywgZnVuY3Rpb24oZSwgc291cmNlKSB7XHJcbiAgICBcclxuICAgIC8vIEVuc3VyaW5nIGlzIHRoZSBvbmUgd2UgdHJpZ2dlclxyXG4gICAgaWYgKHNvdXJjZSA9PT0gJ2hhc2hiYW5nSGlzdG9yeScpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgXHJcbiAgICAvLyBJbiBvdGhlciBjYXNlLCBibG9jazpcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbn0pO1xyXG5cclxuLy8gRXhwb3NlIEFQSVxyXG5tb2R1bGUuZXhwb3J0cyA9IGhhc2hiYW5nSGlzdG9yeTtcclxuIiwiLyoqXHJcbiAgICBEZWZhdWx0IGJ1aWxkIG9mIHRoZSBTaGVsbCBjb21wb25lbnQuXHJcbiAgICBJdCByZXR1cm5zIHRoZSBTaGVsbCBjbGFzcyBhcyBhIG1vZHVsZSBwcm9wZXJ0eSxcclxuICAgIHNldHRpbmcgdXAgdGhlIGJ1aWx0LWluIG1vZHVsZXMgYXMgaXRzIGRlcGVuZGVuY2llcyxcclxuICAgIGFuZCB0aGUgZXh0ZXJuYWwgJ2pxdWVyeScgYW5kICdldmVudHMnIChmb3IgdGhlIEV2ZW50RW1pdHRlcikuXHJcbiAgICBJdCByZXR1cm5zIHRvbyB0aGUgYnVpbHQtaXQgRG9tSXRlbXNNYW5hZ2VyIGNsYXNzIGFzIGEgcHJvcGVydHkgZm9yIGNvbnZlbmllbmNlLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGRlcHMgPSByZXF1aXJlKCcuL2RlcGVuZGVuY2llcycpLFxyXG4gICAgRG9tSXRlbXNNYW5hZ2VyID0gcmVxdWlyZSgnLi9Eb21JdGVtc01hbmFnZXInKSxcclxuICAgIHBhcnNlVXJsID0gcmVxdWlyZSgnLi9wYXJzZVVybCcpLFxyXG4gICAgYWJzb2x1dGl6ZVVybCA9IHJlcXVpcmUoJy4vYWJzb2x1dGl6ZVVybCcpLFxyXG4gICAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgbG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXInKSxcclxuICAgIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcclxuXHJcbiQuZXh0ZW5kKGRlcHMsIHtcclxuICAgIHBhcnNlVXJsOiBwYXJzZVVybCxcclxuICAgIGFic29sdXRpemVVcmw6IGFic29sdXRpemVVcmwsXHJcbiAgICBqcXVlcnk6ICQsXHJcbiAgICBsb2FkZXI6IGxvYWRlcixcclxuICAgIEV2ZW50RW1pdHRlcjogRXZlbnRFbWl0dGVyXHJcbn0pO1xyXG5cclxuLy8gRGVwZW5kZW5jaWVzIGFyZSByZWFkeSwgd2UgY2FuIGxvYWQgdGhlIGNsYXNzOlxyXG52YXIgU2hlbGwgPSByZXF1aXJlKCcuL1NoZWxsJyk7XHJcblxyXG5leHBvcnRzLlNoZWxsID0gU2hlbGw7XHJcbmV4cG9ydHMuRG9tSXRlbXNNYW5hZ2VyID0gRG9tSXRlbXNNYW5hZ2VyO1xyXG4iLCIvKipcclxuICAgIExvYWRlciB1dGlsaXR5IHRvIGxvYWQgU2hlbGwgaXRlbXMgb24gZGVtYW5kIHdpdGggQUpBWFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgXHJcbiAgICBiYXNlVXJsOiAnLycsXHJcbiAgICBcclxuICAgIGxvYWQ6IGZ1bmN0aW9uIGxvYWQocm91dGUpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdTaGVsbCBsb2FkaW5nIG9uIGRlbWFuZCcsIHJvdXRlLm5hbWUsIHJvdXRlKTtcclxuICAgICAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgICAgIHVybDogbW9kdWxlLmV4cG9ydHMuYmFzZVVybCArIHJvdXRlLm5hbWUgKyAnLmh0bWwnLFxyXG4gICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAvLyBXZSBhcmUgbG9hZGluZyB0aGUgcHJvZ3JhbSBhbmQgbm8gbG9hZGVyIHNjcmVlbiBpbiBwbGFjZSxcclxuICAgICAgICAgICAgICAgIC8vIHNvIGFueSBpbiBiZXR3ZWVuIGludGVyYWN0aW9uIHdpbGwgYmUgcHJvYmxlbWF0aWMuXHJcbiAgICAgICAgICAgICAgICAvL2FzeW5jOiBmYWxzZVxyXG4gICAgICAgICAgICB9KS50aGVuKHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgcGFyc2VVcmwgZnVuY3Rpb24gZGV0ZWN0aW5nXHJcbiAgICB0aGUgbWFpbiBwYXJ0cyBvZiB0aGUgVVJMIGluIGFcclxuICAgIGNvbnZlbmllbmNlIHdheSBmb3Igcm91dGluZy5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBnZXRVcmxRdWVyeSA9IHJlcXVpcmUoJy4uL2dldFVybFF1ZXJ5JyksXHJcbiAgICBlc2NhcGVSZWdFeHAgPSByZXF1aXJlKCcuLi9lc2NhcGVSZWdFeHAnKTtcclxuXHJcbmZ1bmN0aW9uIHBhcnNlVXJsKGJhc2VVcmwsIGxpbmspIHtcclxuXHJcbiAgICBsaW5rID0gbGluayB8fCAnJztcclxuXHJcbiAgICB2YXIgcmF3VXJsID0gbGluaztcclxuXHJcbiAgICAvLyBoYXNoYmFuZyBzdXBwb3J0OiByZW1vdmUgdGhlICMhIG9yIHNpbmdsZSAjIGFuZCB1c2UgdGhlIHJlc3QgYXMgdGhlIGxpbmtcclxuICAgIGxpbmsgPSBsaW5rLnJlcGxhY2UoL14jIS8sICcnKS5yZXBsYWNlKC9eIy8sICcnKTtcclxuICAgIFxyXG4gICAgLy8gcmVtb3ZlIG9wdGlvbmFsIGluaXRpYWwgc2xhc2ggb3IgZG90LXNsYXNoXHJcbiAgICBsaW5rID0gbGluay5yZXBsYWNlKC9eXFwvfF5cXC5cXC8vLCAnJyk7XHJcblxyXG4gICAgLy8gVVJMIFF1ZXJ5IGFzIGFuIG9iamVjdCwgZW1wdHkgb2JqZWN0IGlmIG5vIHF1ZXJ5XHJcbiAgICB2YXIgcXVlcnkgPSBnZXRVcmxRdWVyeShsaW5rIHx8ICc/Jyk7XHJcblxyXG4gICAgLy8gcmVtb3ZlIHF1ZXJ5IGZyb20gdGhlIHJlc3Qgb2YgVVJMIHRvIHBhcnNlXHJcbiAgICBsaW5rID0gbGluay5yZXBsYWNlKC9cXD8uKiQvLCAnJyk7XHJcblxyXG4gICAgLy8gUmVtb3ZlIHRoZSBiYXNlVXJsIHRvIGdldCB0aGUgYXBwIGJhc2UuXHJcbiAgICB2YXIgcGF0aCA9IGxpbmsucmVwbGFjZShuZXcgUmVnRXhwKCdeJyArIGVzY2FwZVJlZ0V4cChiYXNlVXJsKSwgJ2knKSwgJycpO1xyXG5cclxuICAgIC8vIEdldCBmaXJzdCBzZWdtZW50IG9yIHBhZ2UgbmFtZSAoYW55dGhpbmcgdW50aWwgYSBzbGFzaCBvciBleHRlbnNpb24gYmVnZ2luaW5nKVxyXG4gICAgdmFyIG1hdGNoID0gL15cXC8/KFteXFwvXFwuXSspW15cXC9dKihcXC8uKikqJC8uZXhlYyhwYXRoKTtcclxuXHJcbiAgICB2YXIgcGFyc2VkID0ge1xyXG4gICAgICAgIHJvb3Q6IHRydWUsXHJcbiAgICAgICAgbmFtZTogbnVsbCxcclxuICAgICAgICBzZWdtZW50czogbnVsbCxcclxuICAgICAgICBwYXRoOiBudWxsLFxyXG4gICAgICAgIHVybDogcmF3VXJsLFxyXG4gICAgICAgIHF1ZXJ5OiBxdWVyeVxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICBwYXJzZWQucm9vdCA9IGZhbHNlO1xyXG4gICAgICAgIGlmIChtYXRjaFsxXSkge1xyXG4gICAgICAgICAgICBwYXJzZWQubmFtZSA9IG1hdGNoWzFdO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1hdGNoWzJdKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQucGF0aCA9IG1hdGNoWzJdO1xyXG4gICAgICAgICAgICAgICAgcGFyc2VkLnNlZ21lbnRzID0gbWF0Y2hbMl0ucmVwbGFjZSgvXlxcLy8sICcnKS5zcGxpdCgnLycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcGFyc2VkLnBhdGggPSAnLyc7XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQuc2VnbWVudHMgPSBbXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcGFyc2VkO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlVXJsOyIsIi8qKlxyXG4gICAgc2FuaXRpemVVcmwgdXRpbGl0eSB0aGF0IGVuc3VyZXNcclxuICAgIHRoYXQgcHJvYmxlbWF0aWMgcGFydHMgZ2V0IHJlbW92ZWQuXHJcbiAgICBcclxuICAgIEFzIGZvciBub3cgaXQgZG9lczpcclxuICAgIC0gcmVtb3ZlcyBwYXJlbnQgZGlyZWN0b3J5IHN5bnRheFxyXG4gICAgLSByZW1vdmVzIGR1cGxpY2F0ZWQgc2xhc2hlc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gc2FuaXRpemVVcmwodXJsKSB7XHJcbiAgICByZXR1cm4gdXJsLnJlcGxhY2UoL1xcLnsyLH0vZywgJycpLnJlcGxhY2UoL1xcL3syLH0vZywgJy8nKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzYW5pdGl6ZVVybDsiLCIvKiogXHJcbiAgICBBcHBNb2RlbCBleHRlbnNpb24sXHJcbiAgICBmb2N1c2VkIG9uIHRoZSBBY2NvdW50IHJlbGF0ZWQgQVBJczpcclxuICAgIC0gbG9naW5cclxuICAgIC0gbG9nb3V0XHJcbiAgICAtIHNpZ251cFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGxvY2FsZm9yYWdlID0gcmVxdWlyZSgnbG9jYWxmb3JhZ2UnKTtcclxuXHJcbmV4cG9ydHMucGx1Z0luID0gZnVuY3Rpb24gKEFwcE1vZGVsKSB7XHJcbiAgICAvKipcclxuICAgICAgICBUcnkgdG8gcGVyZm9ybSBhbiBhdXRvbWF0aWMgbG9naW4gaWYgdGhlcmUgaXMgYSBsb2NhbFxyXG4gICAgICAgIGNvcHkgb2YgY3JlZGVudGlhbHMgdG8gdXNlIG9uIHRoYXQsXHJcbiAgICAgICAgY2FsbGluZyB0aGUgbG9naW4gbWV0aG9kIHRoYXQgc2F2ZSB0aGUgdXBkYXRlZFxyXG4gICAgICAgIGRhdGEgYW5kIHByb2ZpbGUuXHJcbiAgICAqKi9cclxuICAgIEFwcE1vZGVsLnByb3RvdHlwZS50cnlMb2dpbiA9IGZ1bmN0aW9uIHRyeUxvZ2luKCkge1xyXG4gICAgICAgIC8vIEdldCBzYXZlZCBjcmVkZW50aWFsc1xyXG4gICAgICAgIHJldHVybiBsb2NhbGZvcmFnZS5nZXRJdGVtKCdjcmVkZW50aWFscycpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcclxuICAgICAgICAgICAgLy8gSWYgd2UgaGF2ZSBvbmVzLCB0cnkgdG8gbG9nLWluXHJcbiAgICAgICAgICAgIGlmIChjcmVkZW50aWFscykge1xyXG4gICAgICAgICAgICAgICAgLy8gQXR0ZW1wdCBsb2dpbiB3aXRoIHRoYXRcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxvZ2luKFxyXG4gICAgICAgICAgICAgICAgICAgIGNyZWRlbnRpYWxzLnVzZXJuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIGNyZWRlbnRpYWxzLnBhc3N3b3JkXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBzYXZlZCBjcmVkZW50aWFscycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgICAgUGVyZm9ybXMgYSBsb2dpbiBhdHRlbXB0IHdpdGggdGhlIEFQSSBieSB1c2luZ1xyXG4gICAgICAgIHRoZSBwcm92aWRlZCBjcmVkZW50aWFscy5cclxuICAgICoqL1xyXG4gICAgQXBwTW9kZWwucHJvdG90eXBlLmxvZ2luID0gZnVuY3Rpb24gbG9naW4odXNlcm5hbWUsIHBhc3N3b3JkKSB7XHJcblxyXG4gICAgICAgIC8vIFJlc2V0IHRoZSBleHRyYSBoZWFkZXJzIHRvIGF0dGVtcHQgdGhlIGxvZ2luXHJcbiAgICAgICAgdGhpcy5yZXN0LmV4dHJhSGVhZGVycyA9IG51bGw7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnJlc3QucG9zdCgnbG9naW4nLCB7XHJcbiAgICAgICAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcclxuICAgICAgICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkLFxyXG4gICAgICAgICAgICByZXR1cm5Qcm9maWxlOiB0cnVlXHJcbiAgICAgICAgfSkudGhlbihwZXJmb3JtTG9jYWxMb2dpbih0aGlzLCB1c2VybmFtZSwgcGFzc3dvcmQpKTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgICAgUGVyZm9ybXMgYSBsb2dvdXQsIHJlbW92aW5nIGNhY2hlZCBjcmVkZW50aWFsc1xyXG4gICAgICAgIGFuZCBwcm9maWxlIHNvIHRoZSBhcHAgY2FuIGJlIGZpbGxlZCB1cCB3aXRoXHJcbiAgICAgICAgbmV3IHVzZXIgaW5mb3JtYXRpb24uXHJcbiAgICAgICAgSXQgY2FsbHMgdG8gdGhlIEFQSSBsb2dvdXQgY2FsbCB0b28sIHRvIHJlbW92ZVxyXG4gICAgICAgIGFueSBzZXJ2ZXItc2lkZSBzZXNzaW9uIGFuZCBub3RpZmljYXRpb25cclxuICAgICAgICAocmVtb3ZlcyB0aGUgY29va2llIHRvbywgZm9yIGJyb3dzZXIgZW52aXJvbm1lbnRcclxuICAgICAgICB0aGF0IG1heSB1c2UgaXQpLlxyXG4gICAgKiovXHJcbiAgICAvLyBGVVRVUkU6IFRPUkVWSUVXIGlmIHRoZSAvbG9nb3V0IGNhbGwgY2FuIGJlIHJlbW92ZWQuXHJcbiAgICAvLyBUT0RPOiBtdXN0IHJlbW92ZSBhbGwgdGhlIGxvY2FsbHkgc2F2ZWQvY2FjaGVkIGRhdGFcclxuICAgIC8vIHJlbGF0ZWQgdG8gdGhlIHVzZXI/XHJcbiAgICBBcHBNb2RlbC5wcm90b3R5cGUubG9nb3V0ID0gZnVuY3Rpb24gbG9nb3V0KCkge1xyXG5cclxuICAgICAgICAvLyBMb2NhbCBhcHAgY2xvc2Ugc2Vzc2lvblxyXG4gICAgICAgIHRoaXMucmVzdC5leHRyYUhlYWRlcnMgPSBudWxsO1xyXG4gICAgICAgIGxvY2FsZm9yYWdlLnJlbW92ZUl0ZW0oJ2NyZWRlbnRpYWxzJyk7XHJcbiAgICAgICAgbG9jYWxmb3JhZ2UucmVtb3ZlSXRlbSgncHJvZmlsZScpO1xyXG5cclxuICAgICAgICAvLyBEb24ndCBuZWVkIHRvIHdhaXQgdGhlIHJlc3VsdCBvZiB0aGUgUkVTVCBvcGVyYXRpb25cclxuICAgICAgICB0aGlzLnJlc3QucG9zdCgnbG9nb3V0Jyk7XHJcblxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgICAgQXR0ZW1wdHMgdG8gY3JlYXRlIGEgdXNlciBhY2NvdW50LCBnZXR0aW5nIGxvZ2dlZFxyXG4gICAgICAgIGlmIHN1Y2Nlc3NmdWxseSBsaWtlIHdoZW4gZG9pbmcgYSBsb2dpbiBjYWxsLlxyXG4gICAgKiovXHJcbiAgICBBcHBNb2RlbC5wcm90b3R5cGUuc2lnbnVwID0gZnVuY3Rpb24gc2lnbnVwKHVzZXJuYW1lLCBwYXNzd29yZCwgcHJvZmlsZVR5cGUpIHtcclxuXHJcbiAgICAgICAgLy8gUmVzZXQgdGhlIGV4dHJhIGhlYWRlcnMgdG8gYXR0ZW1wdCB0aGUgc2lnbnVwXHJcbiAgICAgICAgdGhpcy5yZXN0LmV4dHJhSGVhZHJlcyA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIFRoZSByZXN1bHQgaXMgdGhlIHNhbWUgYXMgaW4gYSBsb2dpbiwgYW5kXHJcbiAgICAgICAgLy8gd2UgZG8gdGhlIHNhbWUgYXMgdGhlcmUgdG8gZ2V0IHRoZSB1c2VyIGxvZ2dlZFxyXG4gICAgICAgIC8vIG9uIHRoZSBhcHAgb24gc2lnbi11cCBzdWNjZXNzLlxyXG4gICAgICAgIHJldHVybiB0aGlzLnJlc3QucG9zdCgnc2lnbnVwP3V0bV9zb3VyY2U9YXBwJywge1xyXG4gICAgICAgICAgICB1c2VybmFtZTogdXNlcm5hbWUsXHJcbiAgICAgICAgICAgIHBhc3N3b3JkOiBwYXNzd29yZCxcclxuICAgICAgICAgICAgcHJvZmlsZVR5cGU6IHByb2ZpbGVUeXBlLFxyXG4gICAgICAgICAgICByZXR1cm5Qcm9maWxlOiB0cnVlXHJcbiAgICAgICAgfSkudGhlbihwZXJmb3JtTG9jYWxMb2dpbih0aGlzLCB1c2VybmFtZSwgcGFzc3dvcmQpKTtcclxuICAgIH07XHJcbn07XHJcblxyXG5mdW5jdGlvbiBwZXJmb3JtTG9jYWxMb2dpbih0aGlzQXBwTW9kZWwsIHVzZXJuYW1lLCBwYXNzd29yZCkge1xyXG4gICAgXHJcbiAgICByZXR1cm4gZnVuY3Rpb24obG9nZ2VkKSB7XHJcbiAgICAgICAgLy8gdXNlIGF1dGhvcml6YXRpb24ga2V5IGZvciBlYWNoXHJcbiAgICAgICAgLy8gbmV3IFJlc3QgcmVxdWVzdFxyXG4gICAgICAgIHRoaXNBcHBNb2RlbC5yZXN0LmV4dHJhSGVhZGVycyA9IHtcclxuICAgICAgICAgICAgYWx1OiBsb2dnZWQudXNlcklELFxyXG4gICAgICAgICAgICBhbGs6IGxvZ2dlZC5hdXRoS2V5XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8gYXN5bmMgbG9jYWwgc2F2ZSwgZG9uJ3Qgd2FpdFxyXG4gICAgICAgIGxvY2FsZm9yYWdlLnNldEl0ZW0oJ2NyZWRlbnRpYWxzJywge1xyXG4gICAgICAgICAgICB1c2VySUQ6IGxvZ2dlZC51c2VySUQsXHJcbiAgICAgICAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcclxuICAgICAgICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkLFxyXG4gICAgICAgICAgICBhdXRoS2V5OiBsb2dnZWQuYXV0aEtleVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIElNUE9SVEFOVDogTG9jYWwgbmFtZSBrZXB0IGluIHN5bmMgd2l0aCBzZXQtdXAgYXQgQXBwTW9kZWwudXNlclByb2ZpbGVcclxuICAgICAgICBsb2NhbGZvcmFnZS5zZXRJdGVtKCdwcm9maWxlJywgbG9nZ2VkLnByb2ZpbGUpO1xyXG5cclxuICAgICAgICAvLyBTZXQgdXNlciBkYXRhXHJcbiAgICAgICAgdGhpc0FwcE1vZGVsLnVzZXIoKS5tb2RlbC51cGRhdGVXaXRoKGxvZ2dlZC5wcm9maWxlKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGxvZ2dlZDtcclxuICAgIH07XHJcbn1cclxuIiwiLyoqIEFwcE1vZGVsIGV4dGVuc2lvbixcclxuICAgIGZvY3VzZWQgb24gdGhlIEV2ZW50cyBBUElcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxudmFyIENhbGVuZGFyRXZlbnQgPSByZXF1aXJlKCcuLi9tb2RlbHMvQ2FsZW5kYXJFdmVudCcpLFxyXG4gICAgYXBpSGVscGVyID0gcmVxdWlyZSgnLi4vdXRpbHMvYXBpSGVscGVyJyk7XHJcblxyXG5leHBvcnRzLnBsdWdJbiA9IGZ1bmN0aW9uIChBcHBNb2RlbCkge1xyXG4gICAgXHJcbiAgICBhcGlIZWxwZXIuZGVmaW5lQ3J1ZEFwaUZvclJlc3Qoe1xyXG4gICAgICAgIGV4dGVuZGVkT2JqZWN0OiBBcHBNb2RlbC5wcm90b3R5cGUsXHJcbiAgICAgICAgTW9kZWw6IENhbGVuZGFyRXZlbnQsXHJcbiAgICAgICAgbW9kZWxOYW1lOiAnQ2FsZW5kYXJFdmVudCcsXHJcbiAgICAgICAgbW9kZWxMaXN0TmFtZTogJ0NhbGVuZGFyRXZlbnRzJyxcclxuICAgICAgICBtb2RlbFVybDogJ2V2ZW50cycsXHJcbiAgICAgICAgaWRQcm9wZXJ0eU5hbWU6ICdjYWxlbmRhckV2ZW50SUQnXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLyoqICMgQVBJXHJcbiAgICAgICAgQXBwTW9kZWwucHJvdG90eXBlLmdldEV2ZW50czo6XHJcbiAgICAgICAgQHBhcmFtIHtvYmplY3R9IGZpbHRlcnM6IHtcclxuICAgICAgICAgICAgc3RhcnQ6IERhdGUsXHJcbiAgICAgICAgICAgIGVuZDogRGF0ZSxcclxuICAgICAgICAgICAgdHlwZXM6IFszLCA1XSAvLyBbb3B0aW9uYWxdIExpc3QgRXZlbnRUeXBlc0lEc1xyXG4gICAgICAgIH1cclxuICAgICAgICAtLS1cclxuICAgICAgICBBcHBNb2RlbC5wcm90b3R5cGUuZ2V0RXZlbnRcclxuICAgICAgICAtLS1cclxuICAgICAgICBBcHBNb2RlbC5wcm90b3R5cGUucHV0RXZlbnRcclxuICAgICAgICAtLS1cclxuICAgICAgICBBcHBNb2RlbC5wcm90b3R5cGUucG9zdEV2ZW50XHJcbiAgICAgICAgLS0tXHJcbiAgICAgICAgQXBwTW9kZWwucHJvdG90eXBlLmRlbEV2ZW50XHJcbiAgICAgICAgLS0tXHJcbiAgICAgICAgQXBwTW9kZWwucHJvdG90eXBlLnNldEV2ZW50XHJcbiAgICAqKi9cclxufTsiLCIvKipcclxuICAgIEFwcG9pbnRtZW50cyBpcyBhbiBhYnN0cmFjdGlvbiBhcm91bmQgY2FsZW5kYXIgZXZlbnRzXHJcbiAgICB0aGF0IGJlaGF2ZSBhcyBib29raW5ncyBvciBhcyBldmVudHMgKHdoZXJlIGJvb2tpbmdzIGFyZSBidWlsdFxyXG4gICAgb24gdG9wIG9mIGFuIGV2ZW50IGluc3RhbmNlIC0tYSBib29raW5nIHJlY29yZCBtdXN0IGhhdmUgZXZlciBhIGNvbmZpcm1lZERhdGVJRCBldmVudCkuXHJcbiAgICBcclxuICAgIFdpdGggdGhpcyBhcHBNb2RlbCwgdGhlIEFQSXMgdG8gbWFuYWdlIGV2ZW50cyZib29raW5ncyBhcmUgY29tYmluZWQgdG8gb2ZmZXIgcmVsYXRlZFxyXG4gICAgcmVjb3JkcyBlYXNpZXIgaW4gQXBwb2ludG1lbnRzIG9iamVjdHMuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgQXBwb2ludG1lbnQgPSByZXF1aXJlKCcuLi9tb2RlbHMvQXBwb2ludG1lbnQnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoYXBwTW9kZWwpIHtcclxuXHJcbiAgICB2YXIgYXBpID0ge307XHJcbiAgICBcclxuICAgIHZhciBjYWNoZSA9IHtcclxuICAgICAgICBhcHRzQnlEYXRlOiB7fVxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAgICBHZXQgYSBnZW5lcmljIGNhbGVuZGFyIGFwcG9pbnRtZW50IG9iamVjdCwgbWFkZSBvZiBldmVudHMgYW5kL29yIGJvb2tpbmdzLFxyXG4gICAgICAgIGRlcGVuZGluZyBvbiB0aGUgZ2l2ZW4gSUQgaW4gdGhlIGlkcyBvYmplY3QuXHJcbiAgICAgICAgXHJcbiAgICAgICAgVE9ETzogSW1wbGVtZW50IGNhY2hlIGZvciB0aGUgQXBwb2ludG1lbnQgTW9kZWxzICh0aGUgYmFjay1lbmQgbW9kZWxzIGZvclxyXG4gICAgICAgIGJvb2tpbmdzIGFuZCBldmVudHMgaXMgYWxyZWFkeSBtYW5hZ2VkIGJ5IGl0cyBvd24gQVBJKS5cclxuICAgICoqL1xyXG4gICAgYXBpLmdldEFwcG9pbnRtZW50ID0gZnVuY3Rpb24gZ2V0QXBwb2ludG1lbnQoaWRzKSB7XHJcblxyXG4gICAgICAgIGlmIChpZHMuY2FsZW5kYXJFdmVudElEKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5jYWxlbmRhckV2ZW50cy5nZXRFdmVudChpZHMuY2FsZW5kYXJFdmVudElEKVxyXG4gICAgICAgICAgICAudGhlbihBcHBvaW50bWVudC5mcm9tQ2FsZW5kYXJFdmVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGlkcy5ib29raW5nSUQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLmJvb2tpbmdzLmdldEJvb2tpbmcoaWRzLmJvb2tpbmdJRClcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oYm9va2luZykge1xyXG4gICAgICAgICAgICAgICAgLy8gQW4gYXBwb2ludG1lbnQgZm9yIGJvb2tpbmcgbmVlZHMgdGhlIGNvbmZpcm1lZCBldmVudCBpbmZvcm1hdGlvblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLmNhbGVuZGFyRXZlbnRzLmdldEV2ZW50KGJvb2tpbmcuY29uZmlybWVkRGF0ZUlEKCkpXHJcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBBcHBvaW50bWVudC5mcm9tQm9va2luZyhib29raW5nLCBldmVudCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ1VucmVjb2duaXplZCBJRCcpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEdldCBhIGxpc3Qgb2YgZ2VuZXJpYyBjYWxlbmRhciBhcHBvaW50bWVudCBvYmplY3RzLCBtYWRlIG9mIGV2ZW50cyBhbmQvb3IgYm9va2luZ3NcclxuICAgICAgICBieSBEYXRlLlxyXG4gICAgICAgIEl0J3MgY2FjaGVkLlxyXG4gICAgKiovXHJcbiAgICBhcGkuZ2V0QXBwb2ludG1lbnRzQnlEYXRlID0gZnVuY3Rpb24gZ2V0QXBwb2ludG1lbnRzQnlEYXRlKGRhdGUpIHtcclxuICAgICAgICB2YXIgZGF0ZUtleSA9IG1vbWVudChkYXRlKS5mb3JtYXQoJ1lZWVlNTUREJyk7XHJcbiAgICAgICAgaWYgKGNhY2hlLmFwdHNCeURhdGUuaGFzT3duUHJvcGVydHkoZGF0ZUtleSkpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2FjaGUuYXB0c0J5RGF0ZVtkYXRlS2V5XS5kYXRhKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFRPRE8gbGF6eSBsb2FkLCBvbiBiYWNrZ3JvdW5kLCBmb3Igc3luY2hyb25pemF0aW9uLCBkZXBlbmRpbmcgb24gY2FjaGUgY29udHJvbFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gVE9ETyBjaGVjayBsb2NhbGZvcmFnZSBjb3B5IGZpcnN0P1xyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3RlIGxvYWRpbmcgZGF0YVxyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xyXG4gICAgICAgICAgICAgICAgYXBwTW9kZWwuYm9va2luZ3MuZ2V0Qm9va2luZ3NCeURhdGUoZGF0ZSksXHJcbiAgICAgICAgICAgICAgICBhcHBNb2RlbC5jYWxlbmRhckV2ZW50cy5nZXRFdmVudHNCeURhdGUoZGF0ZSlcclxuICAgICAgICAgICAgXSkudGhlbihmdW5jdGlvbihncm91cCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBldmVudHMgPSBncm91cFsxXSxcclxuICAgICAgICAgICAgICAgICAgICBib29raW5ncyA9IGdyb3VwWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgIGFwdHMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnRzICYmIGV2ZW50cygpLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFwdHMgPSBBcHBvaW50bWVudC5saXN0RnJvbUNhbGVuZGFyRXZlbnRzQm9va2luZ3MoZXZlbnRzKCksIGJvb2tpbmdzKCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPIGxvY2FsZm9yYWdlIGNvcHkgb2YgW2RhdGVLZXldPWJvb2tpbmdzXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIFB1dCBpbiBjYWNoZVxyXG4gICAgICAgICAgICAgICAgY2FjaGUuYXB0c0J5RGF0ZVtkYXRlS2V5XSA9IHsgZGF0YTogYXB0cyB9O1xyXG4gICAgICAgICAgICAgICAgLy8gUmV0dXJuIHRoZSBhcnJheVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFwdHM7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEludHJvZHVjZSBmcmVlIHNsb3RzIHdoZXJldmVyIG5lZWRlZCBpbiB0aGUgZ2l2ZW5cclxuICAgICAgICBhcnJheSBvZiBBcHBvaW50bWVudHMsIHRvIGZpbGwgYW55IGdhcCBpbiBhIG5hdHVyYWwgZGF5XHJcbiAgICAgICAgKGZyb20gTWlkbmlnaHQgdG8gTWlkbmlnaHQgbmV4dCBkYXRlKS5cclxuICAgICAgICBBIG5ldyBhcnJheSBpcyByZXR1cm5lZCwgYnV0IHRoZSBvcmlnaW5hbCBnZXRzIHNvcnRlZCBcclxuICAgICAgICBieSBzdGFydFRpbWUuXHJcbiAgICAqKi9cclxuICAgIGFwaS5maWxsV2l0aEZyZWVTbG90cyA9IGZ1bmN0aW9uIGZpbGxXaXRoRnJlZVNsb3RzKGFwcG9pbnRtZW50c0xpc3QpIHtcclxuXHJcbiAgICAgICAgLy8gRmlyc3QsIGVuc3VyZSBsaXN0IGlzIHNvcnRlZFxyXG4gICAgICAgIHZhciBzbG90cyA9IGFwcG9pbnRtZW50c0xpc3Quc29ydChmdW5jdGlvbihhLCBiKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhLnN0YXJ0VGltZSgpID4gYi5zdGFydFRpbWUoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIGZpbGxlZFNsb3RzID0gW10sXHJcbiAgICAgICAgICAgIHplcm9UaW1lID0gJzAwOjAwOjAwJyxcclxuICAgICAgICAgICAgbGFzdCA9IHplcm9UaW1lLFxyXG4gICAgICAgICAgICBsYXN0RGF0ZVRpbWUgPSBudWxsLFxyXG4gICAgICAgICAgICB0aW1lRm9ybWF0ID0gJ0hIOm1tOnNzJztcclxuXHJcbiAgICAgICAgc2xvdHMuZm9yRWFjaChmdW5jdGlvbihzbG90KSB7XHJcbiAgICAgICAgICAgIHZhciBzdGFydCA9IHNsb3Quc3RhcnRUaW1lKCksXHJcbiAgICAgICAgICAgICAgICBzID0gbW9tZW50KHN0YXJ0KSxcclxuICAgICAgICAgICAgICAgIGVuZCA9IHNsb3QuZW5kVGltZSgpLFxyXG4gICAgICAgICAgICAgICAgZSA9IG1vbWVudChlbmQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHMuZm9ybWF0KHRpbWVGb3JtYXQpID4gbGFzdCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChsYXN0RGF0ZVRpbWUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXJzdCBzbG90IG9mIHRoZSBkYXRlLCAxMkFNPTAwOjAwXHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdERhdGVUaW1lID0gbmV3IERhdGUoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0LmdldEZ1bGxZZWFyKCksIHN0YXJ0LmdldE1vbnRoKCksIHN0YXJ0LmdldERhdGUoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgMCwgMCwgMFxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gVGhlcmUgaXMgYSBnYXAsIGZpbGxlZCBpdFxyXG4gICAgICAgICAgICAgICAgZmlsbGVkU2xvdHMucHVzaChBcHBvaW50bWVudC5uZXdGcmVlU2xvdCh7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IGxhc3REYXRlVGltZSxcclxuICAgICAgICAgICAgICAgICAgICBlbmQ6IHN0YXJ0XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZpbGxlZFNsb3RzLnB1c2goc2xvdCk7XHJcbiAgICAgICAgICAgIGxhc3REYXRlVGltZSA9IGVuZDtcclxuICAgICAgICAgICAgbGFzdCA9IGUuZm9ybWF0KHRpbWVGb3JtYXQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBsYXRlc3QgdG8gc2VlIGEgZ2FwIGF0IHRoZSBlbmQ6XHJcbiAgICAgICAgdmFyIGxhc3RFbmQgPSBsYXN0RGF0ZVRpbWUgJiYgbW9tZW50KGxhc3REYXRlVGltZSkuZm9ybWF0KHRpbWVGb3JtYXQpO1xyXG4gICAgICAgIGlmIChsYXN0RW5kICE9PSB6ZXJvVGltZSkge1xyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBhIGdhcCwgZmlsbGVkIGl0XHJcbiAgICAgICAgICAgIHZhciBuZXh0TWlkbmlnaHQgPSBuZXcgRGF0ZShcclxuICAgICAgICAgICAgICAgIGxhc3REYXRlVGltZS5nZXRGdWxsWWVhcigpLFxyXG4gICAgICAgICAgICAgICAgbGFzdERhdGVUaW1lLmdldE1vbnRoKCksXHJcbiAgICAgICAgICAgICAgICAvLyBOZXh0IGRhdGUhXHJcbiAgICAgICAgICAgICAgICBsYXN0RGF0ZVRpbWUuZ2V0RGF0ZSgpICsgMSxcclxuICAgICAgICAgICAgICAgIC8vIEF0IHplcm8gaG91cnMhXHJcbiAgICAgICAgICAgICAgICAwLCAwLCAwXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBmaWxsZWRTbG90cy5wdXNoKEFwcG9pbnRtZW50Lm5ld0ZyZWVTbG90KHtcclxuICAgICAgICAgICAgICAgIHN0YXJ0OiBsYXN0RGF0ZVRpbWUsXHJcbiAgICAgICAgICAgICAgICBlbmQ6IG5leHRNaWRuaWdodFxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmlsbGVkU2xvdHM7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICByZXR1cm4gYXBpO1xyXG59O1xyXG4iLCIvKiogQm9va2luZ3NcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBCb29raW5nID0gcmVxdWlyZSgnLi4vbW9kZWxzL0Jvb2tpbmcnKSxcclxuLy8gIGFwaUhlbHBlciA9IHJlcXVpcmUoJy4uL3V0aWxzL2FwaUhlbHBlcicpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcblxyXG5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShhcHBNb2RlbCkge1xyXG5cclxuICAgIHZhciBhcGkgPSB7XHJcbiAgICAgICAgcmVtb3RlOiB7XHJcbiAgICAgICAgICAgIHJlc3Q6IGFwcE1vZGVsLnJlc3QsXHJcbiAgICAgICAgICAgIGdldEJvb2tpbmdzOiBmdW5jdGlvbihmaWx0ZXJzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5nZXQoJ2Jvb2tpbmdzJywgZmlsdGVycylcclxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJhd0l0ZW1zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJhd0l0ZW1zICYmIHJhd0l0ZW1zLm1hcChmdW5jdGlvbihyYXdJdGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQm9va2luZyhyYXdJdGVtKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuLypcclxuICAgIGFwaUhlbHBlci5kZWZpbmVDcnVkQXBpRm9yUmVzdCh7XHJcbiAgICAgICAgZXh0ZW5kZWRPYmplY3Q6IGFwaS5yZW1vdGUsXHJcbiAgICAgICAgTW9kZWw6IEJvb2tpbmcsXHJcbiAgICAgICAgbW9kZWxOYW1lOiAnQm9va2luZycsXHJcbiAgICAgICAgbW9kZWxMaXN0TmFtZTogJ0Jvb2tpbmdzJyxcclxuICAgICAgICBtb2RlbFVybDogJ2Jvb2tpbmdzJyxcclxuICAgICAgICBpZFByb3BlcnR5TmFtZTogJ2Jvb2tpbmdJRCdcclxuICAgIH0pOyovXHJcblxyXG4gICAgdmFyIGNhY2hlQnlEYXRlID0ge307XHJcblxyXG4gICAgYXBpLmdldEJvb2tpbmdzQnlEYXRlID0gZnVuY3Rpb24gZ2V0Qm9va2luZ3NCeURhdGUoZGF0ZSkge1xyXG4gICAgICAgIHZhciBkYXRlS2V5ID0gbW9tZW50KGRhdGUpLmZvcm1hdCgnWVlZWU1NREQnKTtcclxuICAgICAgICBpZiAoY2FjaGVCeURhdGUuaGFzT3duUHJvcGVydHkoZGF0ZUtleSkpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2FjaGVCeURhdGVbZGF0ZUtleV0pO1xyXG5cclxuICAgICAgICAgICAgLy8gVE9ETyBsYXp5IGxvYWQsIG9uIGJhY2tncm91bmQsIGZvciBzeW5jaHJvbml6YXRpb25cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFRPRE8gY2hlY2sgbG9jYWxmb3JhZ2UgY29weSBmaXJzdFxyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3RlIGxvYWRpbmcgZGF0YVxyXG4gICAgICAgICAgICByZXR1cm4gYXBpLnJlbW90ZS5nZXRCb29raW5ncyh7XHJcbiAgICAgICAgICAgICAgICBzdGFydDogZGF0ZSxcclxuICAgICAgICAgICAgICAgIGVuZDogbW9tZW50KGRhdGUpLmFkZCgxLCAnZGF5cycpLnRvRGF0ZSgpXHJcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24oYm9va2luZ3MpIHtcclxuICAgICAgICAgICAgICAgIC8vIFRPRE8gbG9jYWxmb3JhZ2UgY29weSBvZiBbZGF0ZUtleV09Ym9va2luZ3NcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBQdXQgaW4gY2FjaGUgKHRoZXkgYXJlIGFscmVhZHkgbW9kZWwgaW5zdGFuY2VzKVxyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IGtvLm9ic2VydmFibGVBcnJheShib29raW5ncyk7XHJcbiAgICAgICAgICAgICAgICBjYWNoZUJ5RGF0ZVtkYXRlS2V5XSA9IGFycjtcclxuICAgICAgICAgICAgICAgIC8vIFJldHVybiB0aGUgb2JzZXJ2YWJsZSBhcnJheVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFycjtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgR2V0IHVwY29taW5nIGJvb2tpbmdzIG1ldGEtaW5mb3JtYXRpb24gZm9yIGRhc2hib2FyZCBwYWdlXHJcbiAgICAgICAgVE9ETzogaW1wbGVtZW50IGNhY2hlPz9cclxuICAgICoqL1xyXG4gICAgYXBpLmdldFVwY29taW5nQm9va2luZ3MgPSBmdW5jdGlvbiBnZXRVcGNvbWluZ0Jvb2tpbmdzKCkge1xyXG4gICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgndXBjb21pbmctYm9va2luZ3MnKTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgICAgR2V0IGEgc3BlY2lmaWMgYm9va2luZyBieSBJRFxyXG4gICAgICAgIFRPRE86IEltcGxlbWVudCBjYWNoZT8gcmV1c2luZyBjYWNoZUJ5RGF0ZT9cclxuICAgICoqL1xyXG4gICAgYXBpLmdldEJvb2tpbmcgPSBmdW5jdGlvbiBnZXRCb29raW5nKGlkKSB7XHJcbiAgICAgICAgaWYgKCFpZCkgcmV0dXJuIFByb21pc2UucmVqZWN0KCdUaGUgYm9va2luZ0lEIGlzIHJlcXVpcmVkIHRvIGdldCBhIGJvb2tpbmcnKTtcclxuICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5nZXQoJ2Jvb2tpbmdzLycgKyBpZClcclxuICAgICAgICAudGhlbihmdW5jdGlvbihib29raW5nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQm9va2luZyhib29raW5nKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIHJldHVybiBhcGk7XHJcbn07XHJcbiIsIi8qKiBFdmVudHNcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBDYWxlbmRhckV2ZW50ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0NhbGVuZGFyRXZlbnQnKSxcclxuLy8gIGFwaUhlbHBlciA9IHJlcXVpcmUoJy4uL3V0aWxzL2FwaUhlbHBlcicpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcblxyXG5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShhcHBNb2RlbCkge1xyXG5cclxuICAgIHZhciBhcGkgPSB7XHJcbiAgICAgICAgcmVtb3RlOiB7XHJcbiAgICAgICAgICAgIHJlc3Q6IGFwcE1vZGVsLnJlc3QsXHJcbiAgICAgICAgICAgIGdldENhbGVuZGFyRXZlbnRzOiBmdW5jdGlvbihmaWx0ZXJzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5nZXQoJ2V2ZW50cycsIGZpbHRlcnMpXHJcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihyYXdJdGVtcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByYXdJdGVtcyAmJiByYXdJdGVtcy5tYXAoZnVuY3Rpb24ocmF3SXRlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IENhbGVuZGFyRXZlbnQocmF3SXRlbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBcclxuICAgIHZhciBjYWNoZSA9IHtcclxuICAgICAgICBldmVudHNCeURhdGU6IHt9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qYXBpSGVscGVyLmRlZmluZUNydWRBcGlGb3JSZXN0KHtcclxuICAgICAgICBleHRlbmRlZE9iamVjdDogYXBpLnJlbW90ZSxcclxuICAgICAgICBNb2RlbDogQ2FsZW5kYXJFdmVudCxcclxuICAgICAgICBtb2RlbE5hbWU6ICdDYWxlbmRhckV2ZW50JyxcclxuICAgICAgICBtb2RlbExpc3ROYW1lOiAnQ2FsZW5kYXJFdmVudHMnLFxyXG4gICAgICAgIG1vZGVsVXJsOiAnZXZlbnRzJyxcclxuICAgICAgICBpZFByb3BlcnR5TmFtZTogJ2NhbGVuZGFyRXZlbnRJRCdcclxuICAgIH0pOyovXHJcblxyXG4gICAgYXBpLmdldEV2ZW50c0J5RGF0ZSA9IGZ1bmN0aW9uIGdldEV2ZW50c0J5RGF0ZShkYXRlKSB7XHJcbiAgICAgICAgdmFyIGRhdGVLZXkgPSBtb21lbnQoZGF0ZSkuZm9ybWF0KCdZWVlZTU1ERCcpO1xyXG4gICAgICAgIGlmIChjYWNoZS5ldmVudHNCeURhdGUuaGFzT3duUHJvcGVydHkoZGF0ZUtleSkpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2FjaGUuZXZlbnRzQnlEYXRlW2RhdGVLZXldLmRhdGEpO1xyXG5cclxuICAgICAgICAgICAgLy8gVE9ETyBsYXp5IGxvYWQsIG9uIGJhY2tncm91bmQsIGZvciBzeW5jaHJvbml6YXRpb24sIGJhc2VkIG9uIGNhY2hlIGNvbnRyb2xcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFRPRE8gY2hlY2sgbG9jYWxmb3JhZ2UgY29weSBmaXJzdD9cclxuXHJcbiAgICAgICAgICAgIC8vIFJlbW90ZSBsb2FkaW5nIGRhdGFcclxuICAgICAgICAgICAgcmV0dXJuIGFwaS5yZW1vdGUuZ2V0Q2FsZW5kYXJFdmVudHMoe1xyXG4gICAgICAgICAgICAgICAgc3RhcnQ6IGRhdGUsXHJcbiAgICAgICAgICAgICAgICBlbmQ6IG1vbWVudChkYXRlKS5hZGQoMSwgJ2RheXMnKS50b0RhdGUoKVxyXG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKGV2ZW50cykge1xyXG4gICAgICAgICAgICAgICAgLy8gVE9ETyBsb2NhbGZvcmFnZSBjb3B5IG9mIFtkYXRlS2V5XT1ib29raW5nc1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFB1dCBpbiBjYWNoZSAodGhleSBhcmUgYWxyZWFkeSBtb2RlbCBpbnN0YW5jZXMpXHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0ga28ub2JzZXJ2YWJsZUFycmF5KGV2ZW50cyk7XHJcbiAgICAgICAgICAgICAgICBjYWNoZS5ldmVudHNCeURhdGVbZGF0ZUtleV0gPSB7IGRhdGE6IGFyciB9O1xyXG4gICAgICAgICAgICAgICAgLy8gUmV0dXJuIHRoZSBvYnNlcnZhYmxlIGFycmF5XHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPIFJldmlldyByZWFsbHkgaWYgaGFzIHNlbnNlIHRvIGhhdmUgYW4gb2JzZXJ2YWJsZSBhcnJheSwgdGFrZSBjYXJlIG9mIGl0cyB1c2UgKG9uIGFwcG9pbnRtZW50cyBtYWlubHkpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBHZXQgYSBzcGVjaWZpYyBldmVudCBieSBJRFxyXG4gICAgICAgIFRPRE86IEltcGxlbWVudCBjYWNoZS4gUmV1c2luZyBjYWNoZUJ5RGF0ZSwgcmUtaW5kZXg/XHJcbiAgICAqKi9cclxuICAgIGFwaS5nZXRFdmVudCA9IGZ1bmN0aW9uIGdldEV2ZW50KGlkKSB7XHJcbiAgICAgICAgaWYgKCFpZCkgcmV0dXJuIFByb21pc2UucmVqZWN0KCdUaGUgY2FsZW5kYXJFdmVudElEIGlzIHJlcXVpcmVkIHRvIGdldCBhbiBldmVudCcpO1xyXG5cclxuICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5nZXQoJ2V2ZW50cy8nICsgaWQpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBDYWxlbmRhckV2ZW50KGV2ZW50KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIGFwaTtcclxufTtcclxuIiwiLyoqIENhbGVuZGFyIFN5bmNpbmcgYXBwIG1vZGVsXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgQ2FsZW5kYXJTeW5jaW5nID0gcmVxdWlyZSgnLi4vbW9kZWxzL0NhbGVuZGFyU3luY2luZycpLFxyXG4gICAgUmVtb3RlTW9kZWwgPSByZXF1aXJlKCcuLi91dGlscy9SZW1vdGVNb2RlbCcpO1xyXG5cclxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoYXBwTW9kZWwpIHtcclxuICAgIHZhciByZW0gPSBuZXcgUmVtb3RlTW9kZWwoe1xyXG4gICAgICAgIGRhdGE6IG5ldyBDYWxlbmRhclN5bmNpbmcoKSxcclxuICAgICAgICB0dGw6IHsgbWludXRlczogMSB9LFxyXG4gICAgICAgIGxvY2FsU3RvcmFnZU5hbWU6ICdjYWxlbmRhclN5bmNpbmcnLFxyXG4gICAgICAgIGZldGNoOiBmdW5jdGlvbiBmZXRjaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QuZ2V0KCdjYWxlbmRhci1zeW5jaW5nJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXNoOiBmdW5jdGlvbiBwdXNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5wdXQoJ2NhbGVuZGFyLXN5bmNpbmcnLCB0aGlzLmRhdGEubW9kZWwudG9QbGFpbk9iamVjdCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gRXh0ZW5kaW5nIHdpdGggdGhlIHNwZWNpYWwgQVBJIG1ldGhvZCAncmVzZXRFeHBvcnRVcmwnXHJcbiAgICByZW0uaXNSZXNldGluZyA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgcmVtLnJlc2V0RXhwb3J0VXJsID0gZnVuY3Rpb24gcmVzZXRFeHBvcnRVcmwoKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmVtLmlzUmVzZXRpbmcodHJ1ZSk7XHJcblxyXG4gICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LnBvc3QoJ2NhbGVuZGFyLXN5bmNpbmcvcmVzZXQtZXhwb3J0LXVybCcpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24odXBkYXRlZFN5bmNTZXR0aW5ncykge1xyXG4gICAgICAgICAgICAvLyBVcGRhdGluZyB0aGUgY2FjaGVkIGRhdGFcclxuICAgICAgICAgICAgcmVtLmRhdGEubW9kZWwudXBkYXRlV2l0aCh1cGRhdGVkU3luY1NldHRpbmdzKTtcclxuICAgICAgICAgICAgcmVtLmlzUmVzZXRpbmcoZmFsc2UpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHVwZGF0ZWRTeW5jU2V0dGluZ3M7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiByZW07XHJcbn07XHJcbiIsIi8qKiBIb21lIEFkZHJlc3NcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBBZGRyZXNzID0gcmVxdWlyZSgnLi4vbW9kZWxzL0FkZHJlc3MnKTtcclxuXHJcbnZhciBSZW1vdGVNb2RlbCA9IHJlcXVpcmUoJy4uL3V0aWxzL1JlbW90ZU1vZGVsJyk7XHJcblxyXG5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShhcHBNb2RlbCkge1xyXG4gICAgcmV0dXJuIG5ldyBSZW1vdGVNb2RlbCh7XHJcbiAgICAgICAgZGF0YTogbmV3IEFkZHJlc3MoKSxcclxuICAgICAgICB0dGw6IHsgbWludXRlczogMSB9LFxyXG4gICAgICAgIGxvY2FsU3RvcmFnZU5hbWU6ICdob21lQWRkcmVzcycsXHJcbiAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uIGZldGNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5nZXQoJ2FkZHJlc3Nlcy9ob21lJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXNoOiBmdW5jdGlvbiBwdXNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5wdXQoJ2FkZHJlc3Nlcy9ob21lJywgdGhpcy5kYXRhLm1vZGVsLnRvUGxhaW5PYmplY3QoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qKiBGZXRjaCBKb2IgVGl0bGVzIGFuZCBQcmljaW5nIFR5cGVzIGluZm9ybWF0aW9uXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgbG9jYWxmb3JhZ2UgPSByZXF1aXJlKCdsb2NhbGZvcmFnZScpLFxyXG4gICAgUHJpY2luZ1R5cGUgPSByZXF1aXJlKCcuLi9tb2RlbHMvUHJpY2luZ1R5cGUnKSxcclxuICAgIEpvYlRpdGxlID0gcmVxdWlyZSgnLi4vbW9kZWxzL0pvYlRpdGxlJyk7XHJcblxyXG5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShhcHBNb2RlbCkge1xyXG5cclxuICAgIHZhciBhcGkgPSB7fSxcclxuICAgICAgICBjYWNoZSA9IHtcclxuICAgICAgICAgICAgam9iVGl0bGVzOiB7fSxcclxuICAgICAgICAgICAgcHJpY2luZ1R5cGVzOiBudWxsXHJcbiAgICAgICAgfTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgQ29udmVydCByYXcgYXJyYXkgb2YgcHJpY2luZyB0eXBlcyByZWNvcmRzIGludG9cclxuICAgICAgICBhbiBpbmRleGVkIGFycmF5IG9mIG1vZGVscywgYWN0dWFsbHkgYW4gb2JqZWN0XHJcbiAgICAgICAgd2l0aCBJRCBudW1iZXJzIGFzIHByb3BlcnRpZXMsXHJcbiAgICAgICAgYW5kIGNhY2hlIGl0IGluIG1lbW9yeS5cclxuICAgICoqL1xyXG4gICAgZnVuY3Rpb24gbWFwVG9QcmljaW5nVHlwZXMocmF3SXRlbXMpIHtcclxuICAgICAgICBjYWNoZS5wcmljaW5nVHlwZXMgPSB7fTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAocmF3SXRlbXMpIHtcclxuICAgICAgICAgICAgcmF3SXRlbXMuZm9yRWFjaChmdW5jdGlvbihyYXdJdGVtKSB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZS5wcmljaW5nVHlwZXNbcmF3SXRlbS5wcmljaW5nVHlwZUlEXSA9IG5ldyBQcmljaW5nVHlwZShyYXdJdGVtKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gY2FjaGUucHJpY2luZ1R5cGVzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICAgIFB1YmxpYyBBUElcclxuICAgICAgICBSZXR1cm5zIGEgcHJvbWlzZSB0byBmZXRjaCBwcmljaW5nIHR5cGVzIGluZm9ybWF0aW9uXHJcbiAgICAqKi9cclxuICAgIGFwaS5nZXRQcmljaW5nVHlwZXMgPSBmdW5jdGlvbiBnZXRQcmljaW5nVHlwZXMoKSB7XHJcbiAgICAgICAgLy8gRmlyc3QsIGluLW1lbW9yeSBjYWNoZVxyXG4gICAgICAgIGlmIChjYWNoZS5wcmljaW5nVHlwZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjYWNoZS5wcmljaW5nVHlwZXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gU2Vjb25kLCBsb2NhbCBzdG9yYWdlXHJcbiAgICAgICAgICAgIHJldHVybiBsb2NhbGZvcmFnZS5nZXRJdGVtKCdwcmljaW5nVHlwZXMnKVxyXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihwcmljaW5nVHlwZXMpIHtcclxuICAgICAgICAgICAgICAgIGlmIChwcmljaW5nVHlwZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFwVG9QcmljaW5nVHlwZXMocHJpY2luZ1R5cGVzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoaXJkIGFuZCBsYXN0LCByZW1vdGUgbG9hZGluZ1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgncHJpY2luZy10eXBlcycpXHJcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJhdykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWNoZSBpbiBsb2NhbCBzdG9yYWdlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsZm9yYWdlLnNldEl0ZW0oJ3ByaWNpbmdUeXBlcycsIHJhdyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtYXBUb1ByaWNpbmdUeXBlcyhyYXcpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICAgIFB1YmxpYyBBUElcclxuICAgICAgICBSZXR1cm5zIGEgcHJvbWlzZSB0byBmZXRjaCBhIHByaWNpbmcgdHlwZSBieSBJRFxyXG4gICAgKiovXHJcbiAgICBhcGkuZ2V0UHJpY2luZ1R5cGUgPSBmdW5jdGlvbiBnZXRQcmljaW5nVHlwZShpZCkge1xyXG4gICAgICAgIC8vIFRoZSBSRVNUIEFQSSBhbGxvd3MgdG8gZmV0Y2ggYSBzaW5nbGUgcHJpY2luZyB0eXBlIGJ5IElELFxyXG4gICAgICAgIC8vIGlmIHdlIGhhdmUgdGhhdCBub3QgY2FjaGVkLiBCdXQgc2luY2UgbG9hZCBhbGwgaXMgcXVpY2sgKHRoZXkgYXJlIGEgZmV3XHJcbiAgICAgICAgLy8gYW5kIHdpbGwgc3RheSBiZWluZyBhIHNob3J0IGxpc3QpLCB3ZSBjYW4gYXNrIGZvciBhbGwgYW5kIGdldCBmcm9tIHRoYXQuXHJcbiAgICAgICAgLy8gU28gaXMgZW5vdWdoIHJldXNpbmcgdGhlIGdlbmVyYWwgJ2dldCBhbGwnIEFQSSBhbmQgbW9yZSBzaW1wbGUgY29kZS5cclxuICAgICAgICAvLyBOT1RFOiBUaGUgc2luZ2xlIGl0ZW0gQVBJIHdpbGwgc3RpbGwgYmUgdXNlZnVsIGZvciBmdXR1cmUgc3luYyB1cGRhdGVzLlxyXG4gICAgICAgIHJldHVybiBhcGkuZ2V0UHJpY2luZ1R5cGVzKCkudGhlbihmdW5jdGlvbihhbGxCeUlEKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhbGxCeUlEW2lkXSB8fCBudWxsO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAgICBQdWJsaWMgQVBJXHJcbiAgICAgICAgR2V0IGEgSm9iIFRpdGxlIGluZm9ybWF0aW9uIGJ5IElEXHJcbiAgICAqKi9cclxuICAgIGFwaS5nZXRKb2JUaXRsZSA9IGZ1bmN0aW9uIGdldEpvYlRpdGxlKGlkKSB7XHJcbiAgICAgICAgaWYgKCFpZCkgcmV0dXJuIFByb21pc2UucmVqZWN0KCdOZWVkcyBhbiBJRCB0byBnZXQgYSBKb2IgVGl0bGUnKTtcclxuXHJcbiAgICAgICAgLy8gRmlyc3QsIGluLW1lbW9yeSBjYWNoZVxyXG4gICAgICAgIGlmIChjYWNoZS5qb2JUaXRsZXNbaWRdKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2FjaGUuam9iVGl0bGVzW2lkXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBTZWNvbmQsIGxvY2FsIHN0b3JhZ2VcclxuICAgICAgICAgICAgcmV0dXJuIGxvY2FsZm9yYWdlLmdldEl0ZW0oJ2pvYlRpdGxlcy8nICsgaWQpXHJcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGpvYlRpdGxlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoam9iVGl0bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBjYWNoZSBpbiBtZW1vcnkgYXMgTW9kZWwgaW5zdGFuY2VcclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5qb2JUaXRsZXNbaWRdID0gbmV3IEpvYlRpdGxlKGpvYlRpdGxlKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyByZXR1cm4gaXRcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGUuam9iVGl0bGVzW2lkXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoaXJkIGFuZCBsYXN0LCByZW1vdGUgbG9hZGluZ1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgnam9iLXRpdGxlcy8nICsgaWQpXHJcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJhdykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWNoZSBpbiBsb2NhbCBzdG9yYWdlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsZm9yYWdlLnNldEl0ZW0oJ2pvYlRpdGxlcy8nICsgaWQsIHJhdyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNhY2hlIGluIG1lbW9yeSBhcyBNb2RlbCBpbnN0YW5jZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5qb2JUaXRsZXNbaWRdID0gbmV3IEpvYlRpdGxlKHJhdyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJldHVybiBpdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGUuam9iVGl0bGVzW2lkXTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gYXBpO1xyXG59O1xyXG4iLCIvKiogQXBwTW9kZWwsIGNlbnRyYWxpemVzIGFsbCB0aGUgZGF0YSBmb3IgdGhlIGFwcCxcclxuICAgIGNhY2hpbmcgYW5kIHNoYXJpbmcgZGF0YSBhY3Jvc3MgYWN0aXZpdGllcyBhbmQgcGVyZm9ybWluZ1xyXG4gICAgcmVxdWVzdHNcclxuKiovXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4uL21vZGVscy9Nb2RlbCcpLFxyXG4gICAgUmVzdCA9IHJlcXVpcmUoJy4uL3V0aWxzL1Jlc3QnKSxcclxuICAgIGxvY2FsZm9yYWdlID0gcmVxdWlyZSgnbG9jYWxmb3JhZ2UnKTtcclxuXHJcbmZ1bmN0aW9uIEFwcE1vZGVsKCkge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnVzZXJQcm9maWxlID0gcmVxdWlyZSgnLi9BcHBNb2RlbC51c2VyUHJvZmlsZScpLmNyZWF0ZSh0aGlzKTtcclxuICAgIC8vIE5PVEU6IEFsaWFzIGZvciB0aGUgdXNlciBkYXRhXHJcbiAgICAvLyBUT0RPOlRPUkVWSUVXIGlmIGNvbnRpbnVlIHRvIG1ha2VzIHNlbnNlIHRvIGtlZXAgdGhpcyAndXNlcigpJyBhbGlhcywgZG9jdW1lbnRcclxuICAgIC8vIHdoZXJlIGlzIHVzZWQgYW5kIHdoeSBpcyBwcmVmZXJyZWQgdG8gdGhlIGNhbm9uaWNhbCB3YXkuXHJcbiAgICB0aGlzLnVzZXIgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy51c2VyUHJvZmlsZS5kYXRhO1xyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgdGhpcy5zY2hlZHVsaW5nUHJlZmVyZW5jZXMgPSByZXF1aXJlKCcuL0FwcE1vZGVsLnNjaGVkdWxpbmdQcmVmZXJlbmNlcycpLmNyZWF0ZSh0aGlzKTtcclxuICAgIHRoaXMuY2FsZW5kYXJTeW5jaW5nID0gcmVxdWlyZSgnLi9BcHBNb2RlbC5jYWxlbmRhclN5bmNpbmcnKS5jcmVhdGUodGhpcyk7XHJcbiAgICB0aGlzLnNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSA9IHJlcXVpcmUoJy4vQXBwTW9kZWwuc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlJykuY3JlYXRlKHRoaXMpO1xyXG4gICAgdGhpcy5tYXJrZXRwbGFjZVByb2ZpbGUgPSByZXF1aXJlKCcuL0FwcE1vZGVsLm1hcmtldHBsYWNlUHJvZmlsZScpLmNyZWF0ZSh0aGlzKTtcclxuICAgIHRoaXMuaG9tZUFkZHJlc3MgPSByZXF1aXJlKCcuL0FwcE1vZGVsLmhvbWVBZGRyZXNzJykuY3JlYXRlKHRoaXMpO1xyXG4gICAgdGhpcy5wcml2YWN5U2V0dGluZ3MgPSByZXF1aXJlKCcuL0FwcE1vZGVsLnByaXZhY3lTZXR0aW5ncycpLmNyZWF0ZSh0aGlzKTtcclxuICAgIHRoaXMuYm9va2luZ3MgPSByZXF1aXJlKCcuL0FwcE1vZGVsLmJvb2tpbmdzJykuY3JlYXRlKHRoaXMpO1xyXG4gICAgdGhpcy5jYWxlbmRhckV2ZW50cyA9IHJlcXVpcmUoJy4vQXBwTW9kZWwuY2FsZW5kYXJFdmVudHMnKS5jcmVhdGUodGhpcyk7XHJcbiAgICB0aGlzLmpvYlRpdGxlcyA9IHJlcXVpcmUoJy4vQXBwTW9kZWwuam9iVGl0bGVzJykuY3JlYXRlKHRoaXMpO1xyXG4gICAgdGhpcy51c2VySm9iUHJvZmlsZSA9IHJlcXVpcmUoJy4vQXBwTW9kZWwudXNlckpvYlByb2ZpbGUnKS5jcmVhdGUodGhpcyk7XHJcbiAgICB0aGlzLmFwcG9pbnRtZW50cyA9IHJlcXVpcmUoJy4vQXBwTW9kZWwuYXBwb2ludG1lbnRzJykuY3JlYXRlKHRoaXMpO1xyXG59XHJcblxyXG5yZXF1aXJlKCcuL0FwcE1vZGVsLWFjY291bnQnKS5wbHVnSW4oQXBwTW9kZWwpO1xyXG5cclxuLyoqXHJcbiAgICBMb2FkIGNyZWRlbnRpYWxzIGZyb20gdGhlIGxvY2FsIHN0b3JhZ2UsIHdpdGhvdXQgZXJyb3IgaWYgdGhlcmUgaXMgbm90aGluZ1xyXG4gICAgc2F2ZWQuIElmIGxvYWQgcHJvZmlsZSBkYXRhIHRvbywgcGVyZm9ybWluZyBhbiB0cnlMb2dpbiBpZiBubyBsb2NhbCBkYXRhLlxyXG4qKi9cclxuQXBwTW9kZWwucHJvdG90eXBlLmxvYWRMb2NhbENyZWRlbnRpYWxzID0gZnVuY3Rpb24gbG9hZExvY2FsQ3JlZGVudGlhbHMoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkgeyAvLyBOZXZlciByZWplY3RzOiAsIHJlamVjdCkge1xyXG5cclxuICAgICAgICAvLyBDYWxsYmFjayB0byBqdXN0IHJlc29sdmUgd2l0aG91dCBlcnJvciAocGFzc2luZyBpbiB0aGUgZXJyb3JcclxuICAgICAgICAvLyB0byB0aGUgJ3Jlc29sdmUnIHdpbGwgbWFrZSB0aGUgcHJvY2VzcyB0byBmYWlsKSxcclxuICAgICAgICAvLyBzaW5jZSB3ZSBkb24ndCBuZWVkIHRvIGNyZWF0ZSBhbiBlcnJvciBmb3IgdGhlXHJcbiAgICAgICAgLy8gYXBwIGluaXQsIGlmIHRoZXJlIGlzIG5vdCBlbm91Z2ggc2F2ZWQgaW5mb3JtYXRpb25cclxuICAgICAgICAvLyB0aGUgYXBwIGhhcyBjb2RlIHRvIHJlcXVlc3QgYSBsb2dpbi5cclxuICAgICAgICB2YXIgcmVzb2x2ZUFueXdheSA9IGZ1bmN0aW9uKGRvZXNuTWF0dGVyKXsgICAgICAgIFxyXG4gICAgICAgICAgICBjb25zb2xlLndhcm5pbmcoJ0FwcCBNb2RlbCBJbml0IGVycicsIGRvZXNuTWF0dGVyKTtcclxuICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSWYgdGhlcmUgYXJlIGNyZWRlbnRpYWxzIHNhdmVkXHJcbiAgICAgICAgbG9jYWxmb3JhZ2UuZ2V0SXRlbSgnY3JlZGVudGlhbHMnKS50aGVuKGZ1bmN0aW9uKGNyZWRlbnRpYWxzKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoY3JlZGVudGlhbHMgJiZcclxuICAgICAgICAgICAgICAgIGNyZWRlbnRpYWxzLnVzZXJJRCAmJlxyXG4gICAgICAgICAgICAgICAgY3JlZGVudGlhbHMudXNlcm5hbWUgJiZcclxuICAgICAgICAgICAgICAgIGNyZWRlbnRpYWxzLmF1dGhLZXkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyB1c2UgYXV0aG9yaXphdGlvbiBrZXkgZm9yIGVhY2hcclxuICAgICAgICAgICAgICAgIC8vIG5ldyBSZXN0IHJlcXVlc3RcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzdC5leHRyYUhlYWRlcnMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWx1OiBjcmVkZW50aWFscy51c2VySUQsXHJcbiAgICAgICAgICAgICAgICAgICAgYWxrOiBjcmVkZW50aWFscy5hdXRoS2V5XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBJdCBoYXMgY3JlZGVudGlhbHMhIEhhcyBiYXNpYyBwcm9maWxlIGRhdGE/XHJcbiAgICAgICAgICAgICAgICAvLyBOT1RFOiB0aGUgdXNlclByb2ZpbGUgd2lsbCBsb2FkIGZyb20gbG9jYWwgc3RvcmFnZSBvbiB0aGlzIGZpcnN0XHJcbiAgICAgICAgICAgICAgICAvLyBhdHRlbXB0LCBhbmQgbGF6aWx5IHJlcXVlc3QgdXBkYXRlZCBkYXRhIGZyb20gcmVtb3RlXHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJQcm9maWxlLmxvYWQoKS50aGVuKGZ1bmN0aW9uKHByb2ZpbGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGVyZSBpcyBhIHByb2ZpbGUgY2FjaGVkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVuZCBzdWNjZXNmdWxseVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBObyBwcm9maWxlLCB3ZSBuZWVkIHRvIHJlcXVlc3QgaXQgdG8gYmUgYWJsZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0byB3b3JrIGNvcnJlY3RseSwgc28gd2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXR0ZW1wdCBhIGxvZ2luICh0aGUgdHJ5TG9naW4gcHJvY2VzcyBwZXJmb3Jtc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhIGxvZ2luIHdpdGggdGhlIHNhdmVkIGNyZWRlbnRpYWxzIGFuZCBmZXRjaFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgcHJvZmlsZSB0byBzYXZlIGl0IGluIHRoZSBsb2NhbCBjb3B5KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyeUxvZ2luKCkudGhlbihyZXNvbHZlLCByZXNvbHZlQW55d2F5KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LmJpbmQodGhpcyksIHJlc29sdmVBbnl3YXkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gRW5kIHN1Y2Nlc3NmdWxseS4gTm90IGxvZ2dpbiBpcyBub3QgYW4gZXJyb3IsXHJcbiAgICAgICAgICAgICAgICAvLyBpcyBqdXN0IHRoZSBmaXJzdCBhcHAgc3RhcnQtdXBcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKSwgcmVzb2x2ZUFueXdheSk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59O1xyXG5cclxuLyoqIEluaXRpYWxpemUgYW5kIHdhaXQgZm9yIGFueXRoaW5nIHVwICoqL1xyXG5BcHBNb2RlbC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICBcclxuICAgIC8vIExvY2FsIGRhdGFcclxuICAgIC8vIFRPRE8gSW52ZXN0aWdhdGUgd2h5IGF1dG9tYXRpYyBzZWxlY3Rpb24gYW4gSW5kZXhlZERCIGFyZVxyXG4gICAgLy8gZmFpbGluZyBhbmQgd2UgbmVlZCB0byB1c2UgdGhlIHdvcnNlLXBlcmZvcm1hbmNlIGxvY2Fsc3RvcmFnZSBiYWNrLWVuZFxyXG4gICAgbG9jYWxmb3JhZ2UuY29uZmlnKHtcclxuICAgICAgICBuYW1lOiAnTG9jb25vbWljc0FwcCcsXHJcbiAgICAgICAgdmVyc2lvbjogMC4xLFxyXG4gICAgICAgIHNpemUgOiA0OTgwNzM2LCAvLyBTaXplIG9mIGRhdGFiYXNlLCBpbiBieXRlcy4gV2ViU1FMLW9ubHkgZm9yIG5vdy5cclxuICAgICAgICBzdG9yZU5hbWUgOiAna2V5dmFsdWVwYWlycycsXHJcbiAgICAgICAgZGVzY3JpcHRpb24gOiAnTG9jb25vbWljcyBBcHAnLFxyXG4gICAgICAgIGRyaXZlcjogbG9jYWxmb3JhZ2UuTE9DQUxTVE9SQUdFXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gRmlyc3QsIGdldCBhbnkgc2F2ZWQgbG9jYWwgY29uZmlnXHJcbiAgICAvLyBOT1RFOiBmb3Igbm93LCB0aGlzIGlzIG9wdGlvbmFsLCB0byBnZXQgYSBzYXZlZCBzaXRlVXJsIHJhdGhlciB0aGFuIHRoZVxyXG4gICAgLy8gZGVmYXVsdCBvbmUsIGlmIGFueS5cclxuICAgIHJldHVybiBsb2NhbGZvcmFnZS5nZXRJdGVtKCdjb25maWcnKVxyXG4gICAgLnRoZW4oZnVuY3Rpb24oY29uZmlnKSB7XHJcbiAgICAgICAgLy8gT3B0aW9uYWwgY29uZmlnXHJcbiAgICAgICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChjb25maWcuc2l0ZVVybCkge1xyXG4gICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGh0bWwgVVJMXHJcbiAgICAgICAgICAgICQoJ2h0bWwnKS5hdHRyKCdkYXRhLXNpdGUtdXJsJywgY29uZmlnLnNpdGVVcmwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgY29uZmlnLnNpdGVVcmwgPSAkKCdodG1sJykuYXR0cignZGF0YS1zaXRlLXVybCcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnJlc3QgPSBuZXcgUmVzdChjb25maWcuc2l0ZVVybCArICcvYXBpL3YxL2VuLVVTLycpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFNldHVwIFJlc3QgYXV0aGVudGljYXRpb25cclxuICAgICAgICB0aGlzLnJlc3Qub25BdXRob3JpemF0aW9uUmVxdWlyZWQgPSBmdW5jdGlvbihyZXRyeSkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy50cnlMb2dpbigpXHJcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gTG9nZ2VkISBKdXN0IHJldHJ5XHJcbiAgICAgICAgICAgICAgICByZXRyeSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LmJpbmQodGhpcyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSW5pdGlhbGl6ZTogY2hlY2sgdGhlIHVzZXIgaGFzIGxvZ2luIGRhdGEgYW5kIG5lZWRlZFxyXG4gICAgICAgIC8vIGNhY2hlZCBkYXRhLCByZXR1cm4gaXRzIHByb21pc2VcclxuICAgICAgICByZXR1cm4gdGhpcy5sb2FkTG9jYWxDcmVkZW50aWFscygpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXBwTW9kZWw7XHJcblxyXG4vLyBDbGFzcyBzcGxpdGVkIGluIGRpZmZlcmVudCBmaWxlcyB0byBtaXRpZ2F0ZSBzaXplIGFuZCBvcmdhbml6YXRpb25cclxuLy8gYnV0IGtlZXBpbmcgYWNjZXNzIHRvIHRoZSBjb21tb24gc2V0IG9mIG1ldGhvZHMgYW5kIG9iamVjdHMgZWFzeSB3aXRoXHJcbi8vIHRoZSBzYW1lIGNsYXNzLlxyXG4vLyBMb2FkaW5nIGV4dGVuc2lvbnM6XHJcbnJlcXVpcmUoJy4vQXBwTW9kZWwtZXZlbnRzJykucGx1Z0luKEFwcE1vZGVsKTtcclxuXHJcbiIsIi8qKiBNYXJrZXRwbGFjZVByb2ZpbGVcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBNYXJrZXRwbGFjZVByb2ZpbGUgPSByZXF1aXJlKCcuLi9tb2RlbHMvTWFya2V0cGxhY2VQcm9maWxlJyk7XHJcblxyXG52YXIgUmVtb3RlTW9kZWwgPSByZXF1aXJlKCcuLi91dGlscy9SZW1vdGVNb2RlbCcpO1xyXG5cclxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoYXBwTW9kZWwpIHtcclxuICAgIHJldHVybiBuZXcgUmVtb3RlTW9kZWwoe1xyXG4gICAgICAgIGRhdGE6IG5ldyBNYXJrZXRwbGFjZVByb2ZpbGUoKSxcclxuICAgICAgICB0dGw6IHsgbWludXRlczogMSB9LFxyXG4gICAgICAgIGxvY2FsU3RvcmFnZU5hbWU6ICdtYXJrZXRwbGFjZVByb2ZpbGUnLFxyXG4gICAgICAgIGZldGNoOiBmdW5jdGlvbiBmZXRjaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QuZ2V0KCdtYXJrZXRwbGFjZS1wcm9maWxlJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXNoOiBmdW5jdGlvbiBwdXNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5wdXQoJ21hcmtldHBsYWNlLXByb2ZpbGUnLCB0aGlzLmRhdGEubW9kZWwudG9QbGFpbk9iamVjdCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqIFByaXZhY3kgU2V0dGluZ3NcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcml2YWN5U2V0dGluZ3MgPSByZXF1aXJlKCcuLi9tb2RlbHMvUHJpdmFjeVNldHRpbmdzJyk7XHJcblxyXG52YXIgUmVtb3RlTW9kZWwgPSByZXF1aXJlKCcuLi91dGlscy9SZW1vdGVNb2RlbCcpO1xyXG5cclxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoYXBwTW9kZWwpIHtcclxuICAgIHJldHVybiBuZXcgUmVtb3RlTW9kZWwoe1xyXG4gICAgICAgIGRhdGE6IG5ldyBQcml2YWN5U2V0dGluZ3MoKSxcclxuICAgICAgICB0dGw6IHsgbWludXRlczogMSB9LFxyXG4gICAgICAgIGxvY2FsU3RvcmFnZU5hbWU6ICdwcml2YWN5U2V0dGluZ3MnLFxyXG4gICAgICAgIGZldGNoOiBmdW5jdGlvbiBmZXRjaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QuZ2V0KCdwcml2YWN5LXNldHRpbmdzJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXNoOiBmdW5jdGlvbiBwdXNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5wdXQoJ3ByaXZhY3ktc2V0dGluZ3MnLCB0aGlzLmRhdGEubW9kZWwudG9QbGFpbk9iamVjdCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgU2NoZWR1bGluZ1ByZWZlcmVuY2VzID0gcmVxdWlyZSgnLi4vbW9kZWxzL1NjaGVkdWxpbmdQcmVmZXJlbmNlcycpO1xyXG5cclxudmFyIFJlbW90ZU1vZGVsID0gcmVxdWlyZSgnLi4vdXRpbHMvUmVtb3RlTW9kZWwnKTtcclxuXHJcbmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKGFwcE1vZGVsKSB7XHJcbiAgICByZXR1cm4gbmV3IFJlbW90ZU1vZGVsKHtcclxuICAgICAgICBkYXRhOiBuZXcgU2NoZWR1bGluZ1ByZWZlcmVuY2VzKCksXHJcbiAgICAgICAgdHRsOiB7IG1pbnV0ZXM6IDEgfSxcclxuICAgICAgICBsb2NhbFN0b3JhZ2VOYW1lOiAnc2NoZWR1bGluZ1ByZWZlcmVuY2VzJyxcclxuICAgICAgICBmZXRjaDogZnVuY3Rpb24gZmV0Y2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgnc2NoZWR1bGluZy1wcmVmZXJlbmNlcycpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHVzaDogZnVuY3Rpb24gcHVzaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QucHV0KCdzY2hlZHVsaW5nLXByZWZlcmVuY2VzJywgdGhpcy5kYXRhLm1vZGVsLnRvUGxhaW5PYmplY3QoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSA9IHJlcXVpcmUoJy4uL21vZGVscy9TaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUnKSxcclxuICAgIFJlbW90ZU1vZGVsID0gcmVxdWlyZSgnLi4vdXRpbHMvUmVtb3RlTW9kZWwnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxuLy8gVGhlIHNsb3Qgc2l6ZSBpcyBmaXhlZCB0byAxNSBtaW51dGVzIGJ5IGRlZmF1bHQuXHJcbi8vIE5PVEU6IGN1cnJlbnRseSwgdGhlIEFQSSBvbmx5IGFsbG93cyAxNSBtaW51dGVzIHNsb3RzLFxyXG4vLyBiZWluZyB0aGF0IGltcGxpY2l0LCBidXQgcGFydCBvZiB0aGUgY29kZSBpcyByZWFkeSBmb3IgZXhwbGljaXQgc2xvdFNpemUuXHJcbnZhciBkZWZhdWx0U2xvdFNpemUgPSAxNTtcclxuLy8gQSBsaXN0IG9mIHdlZWsgZGF5IHByb3BlcnRpZXMgbmFtZXMgYWxsb3dlZFxyXG4vLyB0byBiZSBwYXJ0IG9mIHRoZSBvYmplY3RzIGRlc2NyaWJpbmcgd2Vla2x5IHNjaGVkdWxlXHJcbi8vIChzaW1wbGlmaWVkIG9yIGNvbXBsZXRlL3Nsb3QgYmFzZWQpXHJcbi8vIEp1c3QgbG93ZWNhc2VkIGVuZ2xpc2ggbmFtZXNcclxudmFyIHdlZWtEYXlQcm9wZXJ0aWVzID0gWydzdW5kYXknLCAnbW9uZGF5JywgJ3R1ZXNkYXknLCAnd2VkbmVzZGF5JywgJ3RodXJzZGF5JywgJ2ZyaWRheScsICdzYXR1cmRheSddO1xyXG5cclxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoYXBwTW9kZWwpIHtcclxuICAgIHJldHVybiBuZXcgUmVtb3RlTW9kZWwoe1xyXG4gICAgICAgIGRhdGE6IG5ldyBTaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUoKSxcclxuICAgICAgICB0dGw6IHsgbWludXRlczogMSB9LFxyXG4gICAgICAgIGxvY2FsU3RvcmFnZU5hbWU6ICd3ZWVrbHlTY2hlZHVsZScsXHJcbiAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uIGZldGNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5nZXQoJ2F2YWlsYWJpbGl0eS93ZWVrbHktc2NoZWR1bGUnKVxyXG4gICAgICAgICAgICAudGhlbihmcm9tV2Vla2x5U2NoZWR1bGUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHVzaDogZnVuY3Rpb24gcHVzaCgpIHtcclxuICAgICAgICAgICAgdmFyIHBsYWluRGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICdhbGwtdGltZSc6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgJ2pzb24tZGF0YSc6IHt9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmRhdGEuaXNBbGxUaW1lKCkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIHBsYWluRGF0YVsnYWxsLXRpbWUnXSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBwbGFpbkRhdGFbJ2pzb24tZGF0YSddID0gSlNPTi5zdHJpbmdpZnkodG9XZWVrbHlTY2hlZHVsZSh0aGlzLmRhdGEubW9kZWwudG9QbGFpbk9iamVjdCh0cnVlKSkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5wdXQoJ2F2YWlsYWJpbGl0eS93ZWVrbHktc2NoZWR1bGUnLCBwbGFpbkRhdGEpXHJcbiAgICAgICAgICAgIC50aGVuKGZyb21XZWVrbHlTY2hlZHVsZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBmcm9tV2Vla2x5U2NoZWR1bGUod2Vla2x5U2NoZWR1bGUpIHtcclxuICAgIFxyXG4gICAgLy8gTmV3IHNpbXBsaWZpZWQgb2JqZWN0LCBhcyBhIHBsYWluIG9iamVjdCB3aXRoXHJcbiAgICAvLyB3ZWVrZGF5cyBwcm9wZXJ0aWVzIGFuZCBmcm9tLXRvIHByb3BlcnRpZXMgbGlrZTpcclxuICAgIC8vIHsgc3VuZGF5OiB7IGZyb206IDAsIHRvOiA2MCB9IH1cclxuICAgIC8vIFNpbmNlIHRoaXMgaXMgZXhwZWN0ZWQgdG8gYmUgY29uc3VtZWQgYnkgZmV0Y2gtcHVzaFxyXG4gICAgLy8gb3BlcmF0aW9ucywgYW5kIGxhdGVyIGJ5IGFuICdtb2RlbC51cGRhdGVXaXRoJyBvcGVyYXRpb24sXHJcbiAgICAvLyBzbyBwbGFpbiBpcyBzaW1wbGUgYW5kIGJldHRlciBvbiBwZXJmb3JtYW5jZTsgY2FuIGJlXHJcbiAgICAvLyBjb252ZXJ0ZWQgZWFzaWx5IHRvIHRoZSBTaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUgb2JqZWN0LlxyXG4gICAgdmFyIHNpbXBsZVdTID0ge307XHJcbiAgICBcclxuICAgIC8vIE9ubHkgc3VwcG9ydHMgJ2F2YWlsYWJsZScgc3RhdHVzIHdpdGggZGVmYXVsdCAndW5hdmFpbGFibGUnXHJcbiAgICBpZiAod2Vla2x5U2NoZWR1bGUuZGVmYXVsdFN0YXR1cyAhPT0gJ3VuYXZhaWxhYmxlJyB8fFxyXG4gICAgICAgIHdlZWtseVNjaGVkdWxlLnN0YXR1cyAhPT0gJ2F2YWlsYWJsZScpIHtcclxuICAgICAgICB0aHJvdyB7XHJcbiAgICAgICAgICAgIG5hbWU6ICdpbnB1dC1mb3JtYXQnLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiAnV2Vla2x5IHNjaGVkdWxlLCBnaXZlbiBzdGF0dXNlcyBub3Qgc3VwcG9ydGVkLCBzdGF0dXM6ICcgK1xyXG4gICAgICAgICAgICB3ZWVrbHlTY2hlZHVsZS5zdGF0dXMgKyAnLCBkZWZhdWx0U3RhdHVzOiAnICsgXHJcbiAgICAgICAgICAgIHdlZWtseVNjaGVkdWxlLmRlZmF1bHRTdGF0dXNcclxuICAgICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIGdpdmVuIHNsb3RTaXplIG9yIGRlZmF1bHRcclxuICAgIHZhciBzbG90U2l6ZSA9ICh3ZWVrbHlTY2hlZHVsZS5zbG90U2l6ZSB8fCBkZWZhdWx0U2xvdFNpemUpIHwwO1xyXG5cclxuICAgIC8vIFJlYWQgc2xvdHMgcGVyIHdlZWstZGF5ICh7IHNsb3RzOiB7IFwic3VuZGF5XCI6IFtdIH0gfSlcclxuICAgIE9iamVjdC5rZXlzKHdlZWtseVNjaGVkdWxlLnNsb3RzKVxyXG4gICAgLmZvckVhY2goZnVuY3Rpb24od2Vla2RheSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFZlcmlmeSBpcyBhIHdlZWtkYXkgcHJvcGVydHksIG9yIGV4aXQgZWFybHlcclxuICAgICAgICBpZiAod2Vla0RheVByb3BlcnRpZXMuaW5kZXhPZih3ZWVrZGF5KSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB2YXIgZGF5c2xvdHMgPSB3ZWVrbHlTY2hlZHVsZS5zbG90c1t3ZWVrZGF5XTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBXZSBnZXQgdGhlIGZpcnN0IGF2YWlsYWJsZSBzbG90IGFuZCB0aGUgbGFzdCBjb25zZWN1dGl2ZVxyXG4gICAgICAgIC8vIHRvIG1ha2UgdGhlIHJhbmdlXHJcbiAgICAgICAgdmFyIGZyb20gPSBudWxsLFxyXG4gICAgICAgICAgICB0byA9IG51bGwsXHJcbiAgICAgICAgICAgIHByZXZpb3VzID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gdGltZXMgYXJlIG9yZGVyZWQgaW4gYXNjZW5kaW5nXHJcbiAgICAgICAgLy8gYW5kIHdpdGggZm9ybWF0IFwiMDA6MDA6MDBcIiB0aGF0IHdlIGNvbnZlcnQgdG8gbWludXRlc1xyXG4gICAgICAgIC8vIChlbm91Z2ggcHJlY2lzaW9uIGZvciBzaW1wbGlmaWVkIHdlZWtseSBzY2hlZHVsZSlcclxuICAgICAgICAvLyB1c2luZyBtb21lbnQuZHVyYXRpb25cclxuICAgICAgICAvLyBOT1RFOiB1c2luZyAnc29tZScgcmF0aGVyIHRoYW4gJ2ZvckVhY2gnIHRvIGJlIGFibGVcclxuICAgICAgICAvLyB0byBleGl0IGVhcmx5IGZyb20gdGhlIGl0ZXJhdGlvbiBieSByZXR1cm5pbmcgJ3RydWUnXHJcbiAgICAgICAgLy8gd2hlbiB0aGUgZW5kIGlzIHJlYWNoZWQuXHJcbiAgICAgICAgZGF5c2xvdHMuc29tZShmdW5jdGlvbihzbG90KSB7XHJcbiAgICAgICAgICAgIHZhciBtaW51dGVzID0gbW9tZW50LmR1cmF0aW9uKHNsb3QpLmFzTWludXRlcygpIHwwO1xyXG4gICAgICAgICAgICAvLyBXZSBoYXZlIG5vdCBzdGlsbCBhICdmcm9tJyB0aW1lOlxyXG4gICAgICAgICAgICBpZiAoZnJvbSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgZnJvbSA9IG1pbnV0ZXM7XHJcbiAgICAgICAgICAgICAgICBwcmV2aW91cyA9IG1pbnV0ZXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBXZSBoYXZlIGEgYmVnZ2luaW5nLCBjaGVjayBpZiB0aGlzIGlzIGNvbnNlY3V0aXZlXHJcbiAgICAgICAgICAgICAgICAvLyB0byBwcmV2aW91cywgYnkgY2hlY2tpbmcgcHJldmlvdXMgcGx1cyBzbG90U2l6ZVxyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZpb3VzICsgc2xvdFNpemUgPT09IG1pbnV0ZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBOZXcgZW5kXHJcbiAgICAgICAgICAgICAgICAgICAgdG8gPSBtaW51dGVzO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIE5leHQgaXRlcmF0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgcHJldmlvdXMgPSBtaW51dGVzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTm8gY29uc2VjdXRpdmUsIHdlIGFscmVhZHkgaGFzIGEgcmFuZ2UsIGFueVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGFkZGl0aW9uYWwgc2xvdCBpcyBkaXNjYXJkZWQsIG91dCBvZiB0aGVcclxuICAgICAgICAgICAgICAgICAgICAvLyBwcmVjaXNpb24gb2YgdGhlIHNpbXBsaWZpZWQgd2Vla2x5IHNjaGVkdWxlLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHNvIHdlIGNhbiBnbyBvdXQgdGhlIGl0ZXJhdGlvbjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAvLyBOT1RFOiBJZiBpbiBhIGZ1dHVyZSBhIG1vcmUgY29tcGxldGUgc2NoZWR1bGVcclxuICAgICAgICAgICAgICAgICAgICAvLyBuZWVkIHRvIGJlIHdyb3RlbiB1c2luZyBtdWx0aXBsZSByYW5nZXMgcmF0aGVyXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaW5kaXZpZHVhbCBzbG90cywgdGhpcyBpcyB0aGUgcGxhY2UgdG8gY29udGludWVcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb2RpbmcsIHBvcHVsYXRpbmcgYW4gYXJyYXkgb2YgW3tmcm9tLCB0b31dIDotKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gU2xvdHMgY2hlY2tlZCwgY2hlY2sgdGhlIHJlc3VsdFxyXG4gICAgICAgIGlmIChmcm9tICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgc2ltcGxlRGF5ID0ge1xyXG4gICAgICAgICAgICAgICAgZnJvbTogZnJvbSxcclxuICAgICAgICAgICAgICAgIHRvOiAwXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHNpbXBsZVdTW3dlZWtkYXldID0gc2ltcGxlRGF5O1xyXG5cclxuICAgICAgICAgICAgLy8gV2UgaGF2ZSBhIHJhbmdlIVxyXG4gICAgICAgICAgICBpZiAodG8gIT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIC8vIGFuZCBoYXMgYW4gZW5kIVxyXG4gICAgICAgICAgICAgICAgLy8gYWRkIHRoZSBzbG90IHNpemUgdG8gdGhlIGVuZGluZ1xyXG4gICAgICAgICAgICAgICAgc2ltcGxlRGF5LnRvID0gdG8gKyBzbG90U2l6ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIHNtYWxsZXIgcmFuZ2UsIGp1c3Qgb25lIHNsb3QsXHJcbiAgICAgICAgICAgICAgICAvLyBhZGQgdGhlIHNsb3Qgc2l6ZSB0byB0aGUgYmVnaW5pbmdcclxuICAgICAgICAgICAgICAgIHNpbXBsZURheS50byA9IGZyb20gKyBzbG90U2l6ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIERvbmUhXHJcbiAgICByZXR1cm4gc2ltcGxlV1M7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgUGFzcyBpbiBhIHBsYWluIG9iamVjdCwgbm90IGEgbW9kZWwsXHJcbiAgICBnZXR0aW5nIGFuIG9iamVjdCBzdWl0YWJsZSBmb3IgdGhlIEFQSSBlbmRwb2ludC5cclxuKiovXHJcbmZ1bmN0aW9uIHRvV2Vla2x5U2NoZWR1bGUoc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlKSB7XHJcblxyXG4gICAgdmFyIHNsb3RTaXplID0gZGVmYXVsdFNsb3RTaXplO1xyXG4gICAgXHJcbiAgICAvLyBJdCdzIGJ1aWxkIHdpdGggJ2F2YWlsYWJsZScgYXMgZXhwbGljaXQgc3RhdHVzOlxyXG4gICAgdmFyIHdlZWtseVNjaGVkdWxlID0ge1xyXG4gICAgICAgIHN0YXR1czogJ2F2YWlsYWJsZScsXHJcbiAgICAgICAgZGVmYXVsdEF2YWlsYWJpbGl0eTogJ3VuYXZhaWxhYmxlJyxcclxuICAgICAgICBzbG90czoge30sXHJcbiAgICAgICAgc2xvdFNpemU6IHNsb3RTaXplXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIFBlciB3ZWVrZGF5XHJcbiAgICBPYmplY3Qua2V5cyhzaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUpXHJcbiAgICAuZm9yRWFjaChmdW5jdGlvbih3ZWVrZGF5KSB7XHJcblxyXG4gICAgICAgIC8vIFZlcmlmeSBpcyBhIHdlZWtkYXkgcHJvcGVydHksIG9yIGV4aXQgZWFybHlcclxuICAgICAgICBpZiAod2Vla0RheVByb3BlcnRpZXMuaW5kZXhPZih3ZWVrZGF5KSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHNpbXBsZURheSA9IHNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZVt3ZWVrZGF5XTtcclxuXHJcbiAgICAgICAgLy8gV2UgbmVlZCB0byBleHBhbmQgdGhlIHNpbXBsaWZpZWQgdGltZSByYW5nZXMgXHJcbiAgICAgICAgLy8gaW4gc2xvdHMgb2YgdGhlIHNsb3RTaXplXHJcbiAgICAgICAgLy8gVGhlIGVuZCB0aW1lIHdpbGwgYmUgZXhjbHVkZWQsIHNpbmNlIHNsb3RzXHJcbiAgICAgICAgLy8gZGVmaW5lIG9ubHkgdGhlIHN0YXJ0LCBiZWluZyBpbXBsaWNpdCB0aGUgc2xvdFNpemUuXHJcbiAgICAgICAgdmFyIGZyb20gPSBzaW1wbGVEYXkuZnJvbSB8MCxcclxuICAgICAgICAgICAgdG8gPSBzaW1wbGVEYXkudG8gfDA7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgc2xvdCBhcnJheVxyXG4gICAgICAgIHdlZWtseVNjaGVkdWxlLnNsb3RzW3dlZWtkYXldID0gW107XHJcblxyXG4gICAgICAgIC8vIEludGVncml0eSB2ZXJpZmljYXRpb25cclxuICAgICAgICBpZiAodG8gPiBmcm9tKSB7XHJcbiAgICAgICAgICAgIC8vIEl0ZXJhdGUgYnkgdGhlIHNsb3RTaXplIHVudGlsIHdlIHJlYWNoXHJcbiAgICAgICAgICAgIC8vIHRoZSBlbmQsIG5vdCBpbmNsdWRpbmcgdGhlICd0bycgc2luY2VcclxuICAgICAgICAgICAgLy8gc2xvdHMgaW5kaWNhdGUgb25seSB0aGUgc3RhcnQgb2YgdGhlIHNsb3RcclxuICAgICAgICAgICAgLy8gdGhhdCBpcyBhc3N1bWVkIHRvIGZpbGwgYSBzbG90U2l6ZSBzdGFydGluZ1xyXG4gICAgICAgICAgICAvLyBvbiB0aGF0IHNsb3QtdGltZVxyXG4gICAgICAgICAgICB2YXIgcHJldmlvdXMgPSBmcm9tO1xyXG4gICAgICAgICAgICB3aGlsZSAocHJldmlvdXMgPCB0bykge1xyXG4gICAgICAgICAgICAgICAgd2Vla2x5U2NoZWR1bGUuc2xvdHNbd2Vla2RheV0ucHVzaChtaW51dGVzVG9UaW1lU3RyaW5nKHByZXZpb3VzKSk7XHJcbiAgICAgICAgICAgICAgICBwcmV2aW91cyArPSBzbG90U2l6ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIERvbmUhXHJcbiAgICByZXR1cm4gd2Vla2x5U2NoZWR1bGU7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgaW50ZXJuYWwgdXRpbGl0eSBmdW5jdGlvbiAndG8gc3RyaW5nIHdpdGggdHdvIGRpZ2l0cyBhbG1vc3QnXHJcbioqL1xyXG5mdW5jdGlvbiB0d29EaWdpdHMobikge1xyXG4gICAgcmV0dXJuIE1hdGguZmxvb3IobiAvIDEwKSArICcnICsgbiAlIDEwO1xyXG59XHJcblxyXG4vKipcclxuICAgIENvbnZlcnQgYSBudW1iZXIgb2YgbWludXRlc1xyXG4gICAgaW4gYSBzdHJpbmcgbGlrZTogMDA6MDA6MDAgKGhvdXJzOm1pbnV0ZXM6c2Vjb25kcylcclxuKiovXHJcbmZ1bmN0aW9uIG1pbnV0ZXNUb1RpbWVTdHJpbmcobWludXRlcykge1xyXG4gICAgdmFyIGQgPSBtb21lbnQuZHVyYXRpb24obWludXRlcywgJ21pbnV0ZXMnKSxcclxuICAgICAgICBoID0gZC5ob3VycygpLFxyXG4gICAgICAgIG0gPSBkLm1pbnV0ZXMoKSxcclxuICAgICAgICBzID0gZC5zZWNvbmRzKCk7XHJcbiAgICBcclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgdHdvRGlnaXRzKGgpICsgJzonICtcclxuICAgICAgICB0d29EaWdpdHMobSkgKyAnOicgK1xyXG4gICAgICAgIHR3b0RpZ2l0cyhzKVxyXG4gICAgKTtcclxufVxyXG4iLCIvKipcclxuICAgIE1vZGVsIEFQSSB0byBtYW5hZ2UgdGhlIGNvbGxlY3Rpb24gb2YgSm9iIFRpdGxlcyBhc3NpZ25lZFxyXG4gICAgdG8gdGhlIGN1cnJlbnQgdXNlciBhbmQgaXRzIHdvcmtpbmcgZGF0YS5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBVc2VySm9iVGl0bGUgPSByZXF1aXJlKCcuLi9tb2RlbHMvVXNlckpvYlRpdGxlJyksXHJcbiAgICBDYWNoZUNvbnRyb2wgPSByZXF1aXJlKCcuLi91dGlscy9DYWNoZUNvbnRyb2wnKSxcclxuICAgIGxvY2FsZm9yYWdlID0gcmVxdWlyZSgnbG9jYWxmb3JhZ2UnKTtcclxuXHJcbmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKGFwcE1vZGVsKSB7XHJcblxyXG4gICAgdmFyIGFwaSA9IHt9LFxyXG4gICAgICAgIGRlZmF1bHRUdGwgPSB7IG1pbnV0ZXM6IDEgfSxcclxuICAgICAgICBjYWNoZSA9IHtcclxuICAgICAgICAgICAgLy8gQXJyYXkgb2YgdXNlciBqb2IgdGl0bGVzIG1ha2luZ1xyXG4gICAgICAgICAgICAvLyBpdHMgcHJvZmlsZVxyXG4gICAgICAgICAgICB1c2VySm9iUHJvZmlsZToge1xyXG4gICAgICAgICAgICAgICAgY2FjaGU6IG5ldyBDYWNoZUNvbnRyb2woeyB0dGw6IGRlZmF1bHRUdGwgfSksXHJcbiAgICAgICAgICAgICAgICBsaXN0OiBudWxsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIEluZGV4ZWQgbGlzdCBieSBqb2JUaXRsZUlEIHRvIHRoZSB1c2VyIGpvYiB0aXRsZXMgbW9kZWxzXHJcbiAgICAgICAgICAgIC8vIGluIHRoZSBsaXN0IGFuZCBjYWNoZSBpbmZvcm1hdGlvblxyXG4gICAgICAgICAgICB1c2VySm9iVGl0bGVzOiB7fVxyXG4gICAgICAgIH07XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIENvbnZlcnQgcmF3IGFycmF5IG9mIHByaWNpbmcgdHlwZXMgcmVjb3JkcyBpbnRvXHJcbiAgICAgICAgYW4gaW5kZXhlZCBhcnJheSBvZiBtb2RlbHMsIGFjdHVhbGx5IGFuIG9iamVjdFxyXG4gICAgICAgIHdpdGggSUQgbnVtYmVycyBhcyBwcm9wZXJ0aWVzLFxyXG4gICAgICAgIGFuZCBjYWNoZSBpdCBpbiBtZW1vcnkuXHJcbiAgICAqKi9cclxuICAgIGZ1bmN0aW9uIG1hcFRvVXNlckpvYlByb2ZpbGUocmF3SXRlbXMpIHtcclxuICAgICAgICBjYWNoZS51c2VySm9iUHJvZmlsZS5saXN0ID0gW107XHJcbiAgICAgICAgY2FjaGUudXNlckpvYlRpdGxlcyA9IHt9O1xyXG5cclxuICAgICAgICBpZiAocmF3SXRlbXMpIHtcclxuICAgICAgICAgICAgcmF3SXRlbXMuZm9yRWFjaChmdW5jdGlvbihyYXdJdGVtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbSA9IG5ldyBVc2VySm9iVGl0bGUocmF3SXRlbSk7XHJcbiAgICAgICAgICAgICAgICBjYWNoZS51c2VySm9iUHJvZmlsZS5saXN0LnB1c2gobSk7XHJcbiAgICAgICAgICAgICAgICAvLyBTYXZpbmcgYW5kIGluZGV4ZWQgY29weSBhbmQgcGVyIGl0ZW0gY2FjaGUgaW5mb1xyXG4gICAgICAgICAgICAgICAgc2V0R2V0VXNlckpvYlRpdGxlVG9DYWNoZShyYXdJdGVtKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBVcGRhdGUgY2FjaGUgc3RhdGVcclxuICAgICAgICBjYWNoZS51c2VySm9iUHJvZmlsZS5jYWNoZS5sYXRlc3QgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBjYWNoZS51c2VySm9iUHJvZmlsZS5saXN0O1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBHZXQgdGhlIGZ1bGwgam9iUHJvZmlsZSBmcm9tIGxvY2FsIGNvcHksIHRocm93aW5nIGEgUHJvbWlzZSByZWplY3QgZXhjZXB0aW9uIGlmIG5vdGhpbmdcclxuICAgICoqL1xyXG4gICAgZnVuY3Rpb24gZ2V0VXNlckpvYlByb2ZpbGVGcm9tTG9jYWwoKSB7XHJcbiAgICAgICAgcmV0dXJuIGxvY2FsZm9yYWdlLmdldEl0ZW0oJ3VzZXJKb2JQcm9maWxlJylcclxuICAgICAgICAudGhlbihmdW5jdGlvbih1c2VySm9iUHJvZmlsZSkge1xyXG4gICAgICAgICAgICBpZiAodXNlckpvYlByb2ZpbGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXBUb1VzZXJKb2JQcm9maWxlKHVzZXJKb2JQcm9maWxlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBUaHJvdyBlcnJvciwgc28gdXNlIGNhdGNoIHRvIGRldGVjdCBpdFxyXG4gICAgICAgICAgICB0aHJvdyB7IG5hbWU6ICdOb3RGb3VuZExvY2FsJywgbWVzc2FnZTogJ05vdCBmb3VuZCBvbiBsb2NhbCBzdG9yYWdlJyB9O1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBTZXQgYSByYXcgdXNlckpvYlByb2ZpbGUgcmVjb3JkIChmcm9tIHNlcnZlcikgYW5kIHNldCBpdCBpbiB0aGVcclxuICAgICAgICBjYWNoZSwgY3JlYXRpbmcgb3IgdXBkYXRpbmcgdGhlIG1vZGVsIChzbyBhbGwgdGhlIHRpbWUgdGhlIHNhbWUgbW9kZWwgaW5zdGFuY2VcclxuICAgICAgICBpcyB1c2VkKSBhbmQgY2FjaGUgY29udHJvbCBpbmZvcm1hdGlvbi5cclxuICAgICAgICBSZXR1cm5zIHRoZSBtb2RlbCBpbnN0YW5jZS5cclxuICAgICoqL1xyXG4gICAgZnVuY3Rpb24gc2V0R2V0VXNlckpvYlRpdGxlVG9DYWNoZShyYXdJdGVtKSB7XHJcbiAgICAgICAgdmFyIGMgPSBjYWNoZS51c2VySm9iVGl0bGVzW3Jhd0l0ZW0uam9iVGl0bGVJRF0gfHwge307XHJcbiAgICAgICAgLy8gVXBkYXRlIHRoZSBtb2RlbCBpZiBleGlzdHMsIHNvIGdldCByZWZsZWN0ZWQgdG8gYW55b25lIGNvbnN1bWluZyBpdFxyXG4gICAgICAgIGlmIChjLm1vZGVsKSB7XHJcbiAgICAgICAgICAgIGMubW9kZWwubW9kZWwudXBkYXRlV2l0aChyYXdJdGVtKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIEZpcnN0IHRpbWUsIGNyZWF0ZSBtb2RlbFxyXG4gICAgICAgICAgICBjLm1vZGVsID0gbmV3IFVzZXJKb2JUaXRsZShyYXdJdGVtKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gVXBkYXRlIGNhY2hlIGNvbnRyb2xcclxuICAgICAgICBpZiAoYy5jYWNoZSkge1xyXG4gICAgICAgICAgICBjLmNhY2hlLmxhdGVzdCA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBjLmNhY2hlID0gbmV3IENhY2hlQ29udHJvbCh7IHR0bDogZGVmYXVsdFR0bCB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gUmV0dXJuIHRoZSBtb2RlbCwgdXBkYXRlZCBvciBqdXN0IGNyZWF0ZWRcclxuICAgICAgICByZXR1cm4gYy5tb2RlbDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgR2V0IHRoZSBjb250ZW50IGZyb20gdGhlIGNhY2hlLCBmb3IgZnVsbCBwcm9maWxlXHJcbiAgICAgICAgYW5kIHNhdmUgaXQgaW4gbG9jYWwgc3RvcmFnZVxyXG4gICAgKiovXHJcbiAgICBmdW5jdGlvbiBzYXZlQ2FjaGVJbkxvY2FsKCkge1xyXG4gICAgICAgIHZhciBwbGFpbiA9IGNhY2hlLnVzZXJKb2JQcm9maWxlLmxpc3QubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgICAgICAgICAgLy8gRWFjaCBpdGVtIGlzIGEgbW9kZWwsIGdldCBpdCBpbiBwbGFpbjpcclxuICAgICAgICAgICAgcmV0dXJuIGl0ZW0ubW9kZWwudG9QbGFpbk9iamVjdCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGxvY2FsZm9yYWdlLnNldEl0ZW0oJ3VzZXJKb2JQcm9maWxlJywgcGxhaW4pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBQcml2YXRlLCBmZXRjaCBmcm9tIHJlbW90ZVxyXG4gICAgdmFyIGZldGNoVXNlckpvYlByb2ZpbGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gVGhpcmQgYW5kIGxhc3QsIHJlbW90ZSBsb2FkaW5nXHJcbiAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QuZ2V0KCd1c2VyLWpvYi1wcm9maWxlJylcclxuICAgICAgICAudGhlbihmdW5jdGlvbiAocmF3KSB7XHJcbiAgICAgICAgICAgIC8vIENhY2hlIGluIGxvY2FsIHN0b3JhZ2VcclxuICAgICAgICAgICAgbG9jYWxmb3JhZ2Uuc2V0SXRlbSgndXNlckpvYlByb2ZpbGUnLCByYXcpO1xyXG4gICAgICAgICAgICByZXR1cm4gbWFwVG9Vc2VySm9iUHJvZmlsZShyYXcpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgUHVibGljIEFQSVxyXG4gICAgICAgIEdldCB0aGUgY29tcGxldGUgbGlzdCBvZiBVc2VySm9iVGl0bGUgZm9yXHJcbiAgICAgICAgYWxsIHRoZSBKb2JUaXRsZXMgYXNzaWduZWQgdG8gdGhlIGN1cnJlbnQgdXNlclxyXG4gICAgKiovXHJcbiAgICBhcGkuZ2V0VXNlckpvYlByb2ZpbGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gSWYgbm8gY2FjaGUgb3IgbXVzdCByZXZhbGlkYXRlLCBnbyByZW1vdGVcclxuICAgICAgICBpZiAoY2FjaGUudXNlckpvYlByb2ZpbGUuY2FjaGUubXVzdFJldmFsaWRhdGUoKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmV0Y2hVc2VySm9iUHJvZmlsZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gRmlyc3QsIHRyeSBjYWNoZVxyXG4gICAgICAgICAgICBpZiAoY2FjaGUudXNlckpvYlByb2ZpbGUubGlzdClcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2FjaGUudXNlckpvYlByb2ZpbGUubGlzdCk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIC8vIFNlY29uZCwgbG9jYWwgc3RvcmFnZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldFVzZXJKb2JQcm9maWxlRnJvbUxvY2FsKClcclxuICAgICAgICAgICAgICAgIC8vIEZhbGxiYWNrIHRvIHJlbW90ZSBpZiBub3QgZm91bmQgaW4gbG9jYWxcclxuICAgICAgICAgICAgICAgIC5jYXRjaChmZXRjaFVzZXJKb2JQcm9maWxlKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvLyBQcml2YXRlLCBmZXRjaCBmcm9tIHJlbW90ZVxyXG4gICAgdmFyIGZldGNoVXNlckpvYlRpdGxlID0gZnVuY3Rpb24oam9iVGl0bGVJRCkge1xyXG4gICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgndXNlci1qb2ItcHJvZmlsZS8nICsgam9iVGl0bGVJRClcclxuICAgICAgICAudGhlbihmdW5jdGlvbihyYXcpIHtcclxuICAgICAgICAgICAgLy8gU2F2ZSB0byBjYWNoZSBhbmQgZ2V0IG1vZGVsXHJcbiAgICAgICAgICAgIHZhciBtID0gc2V0R2V0VXNlckpvYlRpdGxlVG9DYWNoZShyYXcpO1xyXG4gICAgICAgICAgICAvLyBTYXZlIGluIGxvY2FsXHJcbiAgICAgICAgICAgIHNhdmVDYWNoZUluTG9jYWwoKTtcclxuICAgICAgICAgICAgLy8gUmV0dXJuIG1vZGVsXHJcbiAgICAgICAgICAgIHJldHVybiBtO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgUHVibGljIEFQSVxyXG4gICAgICAgIEdldCBhIFVzZXJKb2JUaXRsZSByZWNvcmQgZm9yIHRoZSBnaXZlblxyXG4gICAgICAgIEpvYlRpdGxlSUQgYW5kIHRoZSBjdXJyZW50IHVzZXIuXHJcbiAgICAqKi9cclxuICAgIGFwaS5nZXRVc2VySm9iVGl0bGUgPSBmdW5jdGlvbiAoam9iVGl0bGVJRCkge1xyXG4gICAgICAgIC8vIFF1aWNrIGVycm9yXHJcbiAgICAgICAgaWYgKCFqb2JUaXRsZUlEKSByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ0pvYiBUaXRsZSBJRCByZXF1aXJlZCcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIElmIG5vIGNhY2hlIG9yIG11c3QgcmV2YWxpZGF0ZSwgZ28gcmVtb3RlXHJcbiAgICAgICAgaWYgKCFjYWNoZS51c2VySm9iVGl0bGVzW2pvYlRpdGxlSURdIHx8XHJcbiAgICAgICAgICAgIGNhY2hlLnVzZXJKb2JUaXRsZXNbam9iVGl0bGVJRF0uY2FjaGUubXVzdFJldmFsaWRhdGUoKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmV0Y2hVc2VySm9iVGl0bGUoam9iVGl0bGVJRCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBGaXJzdCwgdHJ5IGNhY2hlXHJcbiAgICAgICAgICAgIGlmIChjYWNoZS51c2VySm9iVGl0bGVzW2pvYlRpdGxlSURdICYmXHJcbiAgICAgICAgICAgICAgICBjYWNoZS51c2VySm9iVGl0bGVzW2pvYlRpdGxlSURdLm1vZGVsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNhY2hlLnVzZXJKb2JUaXRsZXNbam9iVGl0bGVJRF0ubW9kZWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gU2Vjb25kLCBsb2NhbCBzdG9yYWdlLCB3aGVyZSB3ZSBoYXZlIHRoZSBmdWxsIGpvYiBwcm9maWxlXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0VXNlckpvYlByb2ZpbGVGcm9tTG9jYWwoKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oLyp1c2VySm9iUHJvZmlsZSovKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTm90IG5lZWQgZm9yIHRoZSBwYXJhbWV0ZXIsIHRoZSBkYXRhIGlzXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaW4gbWVtb3J5IGFuZCBpbmRleGVkLCBsb29rIGZvciB0aGUgam9iIHRpdGxlXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlLnVzZXJKb2JUaXRsZXNbam9iVGl0bGVJRF0ubW9kZWw7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLy8gSWYgbm8gbG9jYWwgY29weSAoZXJyb3Igb24gcHJvbWlzZSksXHJcbiAgICAgICAgICAgICAgICAvLyBvciB0aGF0IGRvZXMgbm90IGNvbnRhaW5zIHRoZSBqb2IgdGl0bGUgKGVycm9yIG9uICd0aGVuJyk6XHJcbiAgICAgICAgICAgICAgICAvLyBUaGlyZCBhbmQgbGFzdCwgcmVtb3RlIGxvYWRpbmdcclxuICAgICAgICAgICAgICAgIC5jYXRjaChmZXRjaFVzZXJKb2JUaXRsZS5iaW5kKG51bGwsIGpvYlRpdGxlSUQpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBcclxuICAgIHJldHVybiBhcGk7XHJcbn07XHJcbiIsIi8qKiBVc2VyUHJvZmlsZVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFVzZXIgPSByZXF1aXJlKCcuLi9tb2RlbHMvVXNlcicpO1xyXG5cclxudmFyIFJlbW90ZU1vZGVsID0gcmVxdWlyZSgnLi4vdXRpbHMvUmVtb3RlTW9kZWwnKTtcclxuXHJcbmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKGFwcE1vZGVsKSB7XHJcbiAgICByZXR1cm4gbmV3IFJlbW90ZU1vZGVsKHtcclxuICAgICAgICBkYXRhOiBVc2VyLm5ld0Fub255bW91cygpLFxyXG4gICAgICAgIHR0bDogeyBtaW51dGVzOiAxIH0sXHJcbiAgICAgICAgLy8gSU1QT1JUQU5UOiBLZWVwIHRoZSBuYW1lIGluIHN5bmMgd2l0aCBzZXQtdXAgYXQgQXBwTW9kZWwtYWNjb3VudFxyXG4gICAgICAgIGxvY2FsU3RvcmFnZU5hbWU6ICdwcm9maWxlJyxcclxuICAgICAgICBmZXRjaDogZnVuY3Rpb24gZmV0Y2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgncHJvZmlsZScpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHVzaDogZnVuY3Rpb24gcHVzaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QucHV0KCdwcm9maWxlJywgdGhpcy5kYXRhLm1vZGVsLnRvUGxhaW5PYmplY3QoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgU2ltcGxlIFZpZXcgTW9kZWwgd2l0aCBtYWluIGNyZWRlbnRpYWxzIGZvclxyXG4gICAgdXNlIGluIGEgZm9ybSwgd2l0aCB2YWxpZGF0aW9uLlxyXG4gICAgVXNlZCBieSBMb2dpbiBhbmQgU2lnbnVwIGFjdGl2aXRpZXNcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcblxyXG5mdW5jdGlvbiBGb3JtQ3JlZGVudGlhbHMoKSB7XHJcblxyXG4gICAgdGhpcy51c2VybmFtZSA9IGtvLm9ic2VydmFibGUoJycpO1xyXG4gICAgdGhpcy5wYXNzd29yZCA9IGtvLm9ic2VydmFibGUoJycpO1xyXG4gICAgXHJcbiAgICAvLyB2YWxpZGF0ZSB1c2VybmFtZSBhcyBhbiBlbWFpbFxyXG4gICAgdmFyIGVtYWlsUmVnZXhwID0gL15bLTAtOUEtWmEteiEjJCUmJyorLz0/Xl9ge3x9fi5dK0BbLTAtOUEtWmEteiEjJCUmJyorLz0/Xl9ge3x9fi5dKyQvO1xyXG4gICAgdGhpcy51c2VybmFtZS5lcnJvciA9IGtvLm9ic2VydmFibGUoJycpO1xyXG4gICAgdGhpcy51c2VybmFtZS5zdWJzY3JpYmUoZnVuY3Rpb24odikge1xyXG4gICAgICAgIGlmICh2KSB7XHJcbiAgICAgICAgICAgIGlmIChlbWFpbFJlZ2V4cC50ZXN0KHYpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJuYW1lLmVycm9yKCcnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWUuZXJyb3IoJ0lzIG5vdCBhIHZhbGlkIGVtYWlsJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMudXNlcm5hbWUuZXJyb3IoJ1JlcXVpcmVkJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIFxyXG4gICAgLy8gcmVxdWlyZWQgcGFzc3dvcmRcclxuICAgIHRoaXMucGFzc3dvcmQuZXJyb3IgPSBrby5vYnNlcnZhYmxlKCcnKTtcclxuICAgIHRoaXMucGFzc3dvcmQuc3Vic2NyaWJlKGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICB2YXIgZXJyID0gJyc7XHJcbiAgICAgICAgaWYgKCF2KVxyXG4gICAgICAgICAgICBlcnIgPSAnUmVxdWlyZWQnO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMucGFzc3dvcmQuZXJyb3IoZXJyKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRm9ybUNyZWRlbnRpYWxzO1xyXG4iLCIvKiogTmF2QWN0aW9uIHZpZXcgbW9kZWwuXHJcbiAgICBJdCBhbGxvd3Mgc2V0LXVwIHBlciBhY3Rpdml0eSBmb3IgdGhlIEFwcE5hdiBhY3Rpb24gYnV0dG9uLlxyXG4qKi9cclxudmFyIE1vZGVsID0gcmVxdWlyZSgnLi4vbW9kZWxzL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBOYXZBY3Rpb24odmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGxpbms6ICcnLFxyXG4gICAgICAgIGljb246ICcnLFxyXG4gICAgICAgIHRleHQ6ICcnLFxyXG4gICAgICAgIC8vICdUZXN0JyBpcyB0aGUgaGVhZGVyIHRpdGxlIGJ1dCBwbGFjZWQgaW4gdGhlIGJ1dHRvbi9hY3Rpb25cclxuICAgICAgICBpc1RpdGxlOiBmYWxzZSxcclxuICAgICAgICAvLyAnTGluaycgaXMgdGhlIGVsZW1lbnQgSUQgb2YgYSBtb2RhbCAoc3RhcnRzIHdpdGggYSAjKVxyXG4gICAgICAgIGlzTW9kYWw6IGZhbHNlLFxyXG4gICAgICAgIC8vICdMaW5rJyBpcyBhIFNoZWxsIGNvbW1hbmQsIGxpa2UgJ2dvQmFjayAyJ1xyXG4gICAgICAgIGlzU2hlbGw6IGZhbHNlLFxyXG4gICAgICAgIC8vIFNldCBpZiB0aGUgZWxlbWVudCBpcyBhIG1lbnUgYnV0dG9uLCBpbiB0aGF0IGNhc2UgJ2xpbmsnXHJcbiAgICAgICAgLy8gd2lsbCBiZSB0aGUgSUQgb2YgdGhlIG1lbnUgKGNvbnRhaW5lZCBpbiB0aGUgcGFnZTsgd2l0aG91dCB0aGUgaGFzaCksIHVzaW5nXHJcbiAgICAgICAgLy8gdGhlIHRleHQgYW5kIGljb24gYnV0IHNwZWNpYWwgbWVhbmluZyBmb3IgdGhlIHRleHQgdmFsdWUgJ21lbnUnXHJcbiAgICAgICAgLy8gb24gaWNvbiBwcm9wZXJ0eSB0aGF0IHdpbGwgdXNlIHRoZSBzdGFuZGFyZCBtZW51IGljb24uXHJcbiAgICAgICAgaXNNZW51OiBmYWxzZVxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBOYXZBY3Rpb247XHJcblxyXG4vLyBTZXQgb2YgdmlldyB1dGlsaXRpZXMgdG8gZ2V0IHRoZSBsaW5rIGZvciB0aGUgZXhwZWN0ZWQgaHRtbCBhdHRyaWJ1dGVzXHJcblxyXG5OYXZBY3Rpb24ucHJvdG90eXBlLmdldEhyZWYgPSBmdW5jdGlvbiBnZXRIcmVmKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgICAodGhpcy5pc01lbnUoKSB8fCB0aGlzLmlzTW9kYWwoKSB8fCB0aGlzLmlzU2hlbGwoKSkgP1xyXG4gICAgICAgICcjJyA6XHJcbiAgICAgICAgdGhpcy5saW5rKClcclxuICAgICk7XHJcbn07XHJcblxyXG5OYXZBY3Rpb24ucHJvdG90eXBlLmdldE1vZGFsVGFyZ2V0ID0gZnVuY3Rpb24gZ2V0TW9kYWxUYXJnZXQoKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgICh0aGlzLmlzTWVudSgpIHx8ICF0aGlzLmlzTW9kYWwoKSB8fCB0aGlzLmlzU2hlbGwoKSkgP1xyXG4gICAgICAgICcnIDpcclxuICAgICAgICB0aGlzLmxpbmsoKVxyXG4gICAgKTtcclxufTtcclxuXHJcbk5hdkFjdGlvbi5wcm90b3R5cGUuZ2V0U2hlbGxDb21tYW5kID0gZnVuY3Rpb24gZ2V0U2hlbGxDb21tYW5kKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgICAodGhpcy5pc01lbnUoKSB8fCAhdGhpcy5pc1NoZWxsKCkpID9cclxuICAgICAgICAnJyA6XHJcbiAgICAgICAgdGhpcy5saW5rKClcclxuICAgICk7XHJcbn07XHJcblxyXG5OYXZBY3Rpb24ucHJvdG90eXBlLmdldE1lbnVJRCA9IGZ1bmN0aW9uIGdldE1lbnVJRCgpIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgKCF0aGlzLmlzTWVudSgpKSA/XHJcbiAgICAgICAgJycgOlxyXG4gICAgICAgIHRoaXMubGluaygpXHJcbiAgICApO1xyXG59O1xyXG5cclxuTmF2QWN0aW9uLnByb3RvdHlwZS5nZXRNZW51TGluayA9IGZ1bmN0aW9uIGdldE1lbnVMaW5rKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgICAoIXRoaXMuaXNNZW51KCkpID9cclxuICAgICAgICAnJyA6XHJcbiAgICAgICAgJyMnICsgdGhpcy5saW5rKClcclxuICAgICk7XHJcbn07XHJcblxyXG4vKiogU3RhdGljLCBzaGFyZWQgYWN0aW9ucyAqKi9cclxuTmF2QWN0aW9uLmdvSG9tZSA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgbGluazogJy8nLFxyXG4gICAgaWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24taG9tZSdcclxufSk7XHJcblxyXG5OYXZBY3Rpb24uZ29CYWNrID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnZ29CYWNrJyxcclxuICAgIGljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLWFycm93LWxlZnQnLFxyXG4gICAgaXNTaGVsbDogdHJ1ZVxyXG59KTtcclxuXHJcbi8vIFRPRE8gVE8gUkVNT1ZFLCBFeGFtcGxlIG9mIG1vZGFsXHJcbk5hdkFjdGlvbi5uZXdJdGVtID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnI25ld0l0ZW0nLFxyXG4gICAgaWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICBpc01vZGFsOiB0cnVlXHJcbn0pO1xyXG5cclxuTmF2QWN0aW9uLm1lbnVJbiA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgbGluazogJ21lbnVJbicsXHJcbiAgICBpY29uOiAnbWVudScsXHJcbiAgICBpc01lbnU6IHRydWVcclxufSk7XHJcblxyXG5OYXZBY3Rpb24ubWVudU91dCA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgbGluazogJ21lbnVPdXQnLFxyXG4gICAgaWNvbjogJ21lbnUnLFxyXG4gICAgaXNNZW51OiB0cnVlXHJcbn0pO1xyXG5cclxuTmF2QWN0aW9uLm1lbnVOZXdJdGVtID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnbWVudU5ld0l0ZW0nLFxyXG4gICAgaWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICBpc01lbnU6IHRydWVcclxufSk7XHJcblxyXG5OYXZBY3Rpb24uZ29IZWxwSW5kZXggPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICcjaGVscEluZGV4JyxcclxuICAgIHRleHQ6ICdoZWxwJyxcclxuICAgIGlzTW9kYWw6IHRydWVcclxufSk7XHJcblxyXG5OYXZBY3Rpb24uZ29Mb2dpbiA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgbGluazogJy9sb2dpbicsXHJcbiAgICB0ZXh0OiAnbG9nLWluJ1xyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5nb0xvZ291dCA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgbGluazogJy9sb2dvdXQnLFxyXG4gICAgdGV4dDogJ2xvZy1vdXQnXHJcbn0pO1xyXG5cclxuTmF2QWN0aW9uLmdvU2lnbnVwID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnL3NpZ251cCcsXHJcbiAgICB0ZXh0OiAnc2lnbi11cCdcclxufSk7XHJcbiIsIi8qKiBOYXZCYXIgdmlldyBtb2RlbC5cclxuICAgIEl0IGFsbG93cyBjdXN0b21pemUgdGhlIE5hdkJhciBwZXIgYWN0aXZpdHkuXHJcbioqL1xyXG52YXIgTW9kZWwgPSByZXF1aXJlKCcuLi9tb2RlbHMvTW9kZWwnKTtcclxuICAgIC8vTmF2QWN0aW9uID0gcmVxdWlyZSgnLi9OYXZBY3Rpb24nKTtcclxuXHJcbmZ1bmN0aW9uIE5hdkJhcih2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgLy8gVGl0bGUgc2hvd2VkIGluIHRoZSBjZW50ZXJcclxuICAgICAgICAvLyBXaGVuIHRoZSB0aXRsZSBpcyAnbnVsbCcsIHRoZSBhcHAgbG9nbyBpcyBzaG93ZWQgaW4gcGxhY2UsXHJcbiAgICAgICAgLy8gb24gZW1wdHkgdGV4dCwgdGhlIGVtcHR5IHRleHQgaXMgc2hvd2VkIGFuZCBubyBsb2dvLlxyXG4gICAgICAgIHRpdGxlOiAnJyxcclxuICAgICAgICAvLyBOYXZBY3Rpb24gaW5zdGFuY2U6XHJcbiAgICAgICAgbGVmdEFjdGlvbjogbnVsbCxcclxuICAgICAgICAvLyBOYXZBY3Rpb24gaW5zdGFuY2U6XHJcbiAgICAgICAgcmlnaHRBY3Rpb246IG51bGxcclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTmF2QmFyO1xyXG4iLCIvKipcclxuICAgIFRpbWVTbG90IHZpZXcgbW9kZWwgKGFrYTogQ2FsZW5kYXJTbG90KSBmb3IgdXNlXHJcbiAgICBhcyBwYXJ0IG9mIHRoZSB0ZW1wbGF0ZS9jb21wb25lbnQgdGltZS1zbG90LXRpbGUgb3IgYWN0aXZpdGllc1xyXG4gICAgcHJvdmlkaW5nIGRhdGEgZm9yIHRoZSB0ZW1wbGF0ZS5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBnZXRPYnNlcnZhYmxlID0gcmVxdWlyZSgnLi4vdXRpbHMvZ2V0T2JzZXJ2YWJsZScpO1xyXG5cclxuZnVuY3Rpb24gVGltZVNsb3RWaWV3TW9kZWwocGFyYW1zKSB7XHJcbiAgICAvKmpzaGludCBtYXhjb21wbGV4aXR5OjkqL1xyXG5cclxuICAgIHRoaXMuc3RhcnRUaW1lID0gZ2V0T2JzZXJ2YWJsZShwYXJhbXMuc3RhcnRUaW1lIHx8IG51bGwpO1xyXG4gICAgdGhpcy5lbmRUaW1lID0gZ2V0T2JzZXJ2YWJsZShwYXJhbXMuZW5kVGltZSB8fCBudWxsKTtcclxuICAgIHRoaXMuc3ViamVjdCA9IGdldE9ic2VydmFibGUocGFyYW1zLnN1YmplY3QgfHwgbnVsbCk7XHJcbiAgICB0aGlzLmRlc2NyaXB0aW9uID0gZ2V0T2JzZXJ2YWJsZShwYXJhbXMuZGVzY3JpcHRpb24gfHwgbnVsbCk7XHJcbiAgICB0aGlzLmxpbmsgPSBnZXRPYnNlcnZhYmxlKHBhcmFtcy5saW5rIHx8IG51bGwpO1xyXG4gICAgdGhpcy5hY3Rpb25JY29uID0gZ2V0T2JzZXJ2YWJsZShwYXJhbXMuYWN0aW9uSWNvbiB8fCBudWxsKTtcclxuICAgIHRoaXMuYWN0aW9uVGV4dCA9IGdldE9ic2VydmFibGUocGFyYW1zLmFjdGlvblRleHQgfHwgbnVsbCk7XHJcbiAgICB0aGlzLmNsYXNzTmFtZXMgPSBnZXRPYnNlcnZhYmxlKHBhcmFtcy5jbGFzc05hbWVzIHx8IG51bGwpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRpbWVTbG90Vmlld01vZGVsO1xyXG5cclxudmFyIG51bWVyYWwgPSByZXF1aXJlKCdudW1lcmFsJyk7XHJcblxyXG4vKipcclxuICAgIFN0YXRpYyBjb25zdHJ1Y3RvciB0byBjb252ZXJ0IGFuIEFwcG9pbnRtZW50IG1vZGVsIGludG8gXHJcbiAgICBhIFRpbWVTbG90IGluc3RhbmNlIGZvbGxvd2luZyBVSSBjcml0ZXJpYSBmb3IgcHJlc2V0IHZhbHVlcy9zZXR1cC5cclxuKiovXHJcblRpbWVTbG90Vmlld01vZGVsLmZyb21BcHBvaW50bWVudCA9IGZ1bmN0aW9uIGZyb21BcHBvaW50bWVudChhcHQpIHtcclxuICAgIC8qanNoaW50IG1heGNvbXBsZXhpdHk6OCAqL1xyXG4gICAgcmV0dXJuIG5ldyBUaW1lU2xvdFZpZXdNb2RlbCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBhcHQuc3RhcnRUaW1lLFxyXG4gICAgICAgIGVuZFRpbWU6IGFwdC5lbmRUaW1lLFxyXG4gICAgICAgIHN1YmplY3Q6IGFwdC5zdW1tYXJ5LFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBhcHQuZGVzY3JpcHRpb24sXHJcbiAgICAgICAgbGluazogJyMhYXBwb2ludG1lbnQvJyArIGFwdC5zdGFydFRpbWUoKS50b0lTT1N0cmluZygpICsgJy8nICsgYXB0LmlkKCksXHJcbiAgICAgICAgYWN0aW9uSWNvbjogKGFwdC5zb3VyY2VCb29raW5nKCkgPyBudWxsIDogYXB0LnNvdXJjZUV2ZW50KCkgPyAnZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0JyA6ICFhcHQuaWQoKSA/ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnIDogbnVsbCksXHJcbiAgICAgICAgYWN0aW9uVGV4dDogKFxyXG4gICAgICAgICAgICBhcHQuc291cmNlQm9va2luZygpICYmIFxyXG4gICAgICAgICAgICBhcHQuc291cmNlQm9va2luZygpLmJvb2tpbmdSZXF1ZXN0KCkgJiYgXHJcbiAgICAgICAgICAgIGFwdC5zb3VyY2VCb29raW5nKCkuYm9va2luZ1JlcXVlc3QoKS5wcmljaW5nRXN0aW1hdGUoKSA/IFxyXG4gICAgICAgICAgICBudW1lcmFsKGFwdC5zb3VyY2VCb29raW5nKCkuYm9va2luZ1JlcXVlc3QoKS5wcmljaW5nRXN0aW1hdGUoKS50b3RhbFByaWNlKCkgfHwgMCkuZm9ybWF0KCckMC4wMCcpIDpcclxuICAgICAgICAgICAgbnVsbFxyXG4gICAgICAgICksXHJcbiAgICAgICAgY2xhc3NOYW1lczogKGFwdC5pZCgpID8gbnVsbCA6ICdMaXN0Vmlldy1pdGVtLS10YWctc3VjY2VzcycpXHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBVc2VySm9iUHJvZmlsZVZpZXdNb2RlbDogbG9hZHMgZGF0YSBhbmQga2VlcCBzdGF0ZVxyXG4gICAgdG8gZGlzcGxheSB0aGUgbGlzdGluZyBvZiBqb2IgdGl0bGVzIGZyb20gdGhlIFxyXG4gICAgdXNlciBqb2IgcHJvZmlsZS5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcblxyXG5mdW5jdGlvbiBVc2VySm9iUHJvZmlsZVZpZXdNb2RlbChhcHApIHtcclxuICAgIFxyXG4gICAgdGhpcy51c2VySm9iUHJvZmlsZSA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcblxyXG4gICAgdGhpcy5pc0ZpcnN0VGltZSA9IGtvLm9ic2VydmFibGUodHJ1ZSk7XHJcbiAgICB0aGlzLmlzTG9hZGluZyA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgdGhpcy5pc1N5bmNpbmcgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuICAgIHRoaXMudGhlcmVJc0Vycm9yID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcbiAgICBcclxuICAgIC8vIExvYWQgYW5kIHNhdmUgam9iIHRpdGxlIGluZm9cclxuICAgIHZhciBqb2JUaXRsZXNJbmRleCA9IHt9O1xyXG4gICAgZnVuY3Rpb24gc3luY0pvYlRpdGxlKGpvYlRpdGxlSUQpIHtcclxuICAgICAgICByZXR1cm4gYXBwLm1vZGVsLmpvYlRpdGxlcy5nZXRKb2JUaXRsZShqb2JUaXRsZUlEKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGpvYlRpdGxlKSB7XHJcbiAgICAgICAgICAgIGpvYlRpdGxlc0luZGV4W2pvYlRpdGxlSURdID0gam9iVGl0bGU7XHJcblxyXG4gICAgICAgICAgICAvLyBUT0RPOiBlcnJvcnM/IG5vdC1mb3VuZCBqb2IgdGl0bGU/XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICAvLyBDcmVhdGVzIGEgJ2pvYlRpdGxlJyBvYnNlcnZhYmxlIG9uIHRoZSB1c2VySm9iVGl0bGVcclxuICAgIC8vIG1vZGVsIHRvIGhhdmUgYWNjZXNzIHRvIGEgY2FjaGVkIGpvYlRpdGxlIG1vZGVsLlxyXG4gICAgZnVuY3Rpb24gYXR0YWNoSm9iVGl0bGUodXNlckpvYlRpdGxlKSB7XHJcbiAgICAgICAgdXNlckpvYlRpdGxlLmpvYlRpdGxlID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgcmV0dXJuIGpvYlRpdGxlc0luZGV4W3RoaXMuam9iVGl0bGVJRCgpXTtcclxuICAgICAgICB9LCB1c2VySm9iVGl0bGUpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB2YXIgc2hvd0xvYWRpbmdFcnJvciA9IGZ1bmN0aW9uIHNob3dMb2FkaW5nRXJyb3IoZXJyKSB7XHJcbiAgICAgICAgYXBwLm1vZGFscy5zaG93RXJyb3Ioe1xyXG4gICAgICAgICAgICB0aXRsZTogJ0FuIGVycm9yIGhhcHBlbmluZyB3aGVuIGxvYWRpbmcgeW91ciBqb2IgcHJvZmlsZS4nLFxyXG4gICAgICAgICAgICBlcnJvcjogZXJyICYmIGVyci5lcnJvciB8fCBlcnJcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmlzTG9hZGluZyhmYWxzZSk7XHJcbiAgICAgICAgdGhpcy5pc1N5bmNpbmcoZmFsc2UpO1xyXG4gICAgICAgIHRoaXMudGhlcmVJc0Vycm9yKHRydWUpO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG5cclxuICAgIC8vIExvYWRpbmcgYW5kIHN5bmMgb2YgZGF0YVxyXG4gICAgdGhpcy5zeW5jID0gZnVuY3Rpb24gc3luYygpIHtcclxuICAgICAgICB2YXIgZmlyc3RUaW1lID0gdGhpcy5pc0ZpcnN0VGltZSgpO1xyXG4gICAgICAgIHRoaXMuaXNGaXJzdFRpbWUoZmFsc2UpO1xyXG5cclxuICAgICAgICBpZiAoZmlyc3RUaW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5pc1N5bmNpbmcodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBLZWVwIGRhdGEgdXBkYXRlZDpcclxuICAgICAgICBhcHAubW9kZWwudXNlckpvYlByb2ZpbGUuZ2V0VXNlckpvYlByb2ZpbGUoKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHVzZXJKb2JQcm9maWxlKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBXZSBuZWVkIHRoZSBqb2IgdGl0bGVzIGluZm8gYmVmb3JlIGVuZFxyXG4gICAgICAgICAgICBQcm9taXNlLmFsbCh1c2VySm9iUHJvZmlsZS5tYXAoZnVuY3Rpb24odXNlckpvYlRpdGxlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3luY0pvYlRpdGxlKHVzZXJKb2JUaXRsZS5qb2JUaXRsZUlEKCkpO1xyXG4gICAgICAgICAgICB9KSlcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGpvYlRpdGxlIHByb3BlcnR5IGJlZm9yZSB1cGRhdGVcclxuICAgICAgICAgICAgICAgIC8vIG9ic2VydmFibGUgd2l0aCB0aGUgcHJvZmlsZVxyXG4gICAgICAgICAgICAgICAgdXNlckpvYlByb2ZpbGUuZm9yRWFjaChhdHRhY2hKb2JUaXRsZSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlckpvYlByb2ZpbGUodXNlckpvYlByb2ZpbGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNTeW5jaW5nKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudGhlcmVJc0Vycm9yKGZhbHNlKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKVxyXG4gICAgICAgICAgICAuY2F0Y2goc2hvd0xvYWRpbmdFcnJvcik7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxyXG4gICAgICAgIC5jYXRjaChzaG93TG9hZGluZ0Vycm9yKTtcclxuXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVXNlckpvYlByb2ZpbGVWaWV3TW9kZWw7XHJcbiJdfQ==
;