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
        }.bind(this)
    });
    
    this.registerHandler({
        target: this.viewModel.editMode,
        handler: function(isEdit) {
            this.$activity.toggleClass('in-edit', isEdit);
            this.$appointmentView.find('.AppointmentCard').toggleClass('in-edit', isEdit);

            if (isEdit) {
                // Create a copy of the appointment so we revert on 'cancel'
                this.viewModel.originalEditedAppointment = 
                    ko.toJS(this.viewModel.currentAppointment());
            }

        }.bind(this)
    });
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
    
    // If there are options (may not be on startup or
    // on cancelled edition).
    if (options !== null) {

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
    }
};

var Appointment = require('../models/Appointment');

A.prototype.showAppointment = function showAppointment(apt) {

    if (typeof(apt) === 'number') {
        if (apt) {
            // TODO: select appointment apt ID

        } else if (apt === 0) {
            this.viewModel.newAppointment(new Appointment());
            this.viewModel.editMode(true);
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
            this.viewModel.newAppointment(new Appointment(apt));
            this.viewModel.editMode(true);
        }
    }
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

function ViewModel(app) {
    /*jshint maxstatements: 30 */

    this.appointments = ko.observableArray([]);
    this.currentIndex = ko.observable(0);
    this.editMode = ko.observable(false);
    this.newAppointment = ko.observable(null);
    this.noAppointment = new Appointment({
        id: -1,
        summary: 'There is no appointments on this date'
    });

    this.isNew = ko.computed(function(){
        return this.newAppointment() !== null;
    }, this);

    this.currentAppointment = ko.computed({
        read: function() {
            if (this.isNew()) {
                return this.newAppointment();
            }
            else {
                var apt = this.appointments()[this.currentIndex() % this.appointments().length];
                if (!apt)
                    return this.noAppointment;
                return apt;
            }
        },
        write: function(apt) {
            var index = this.currentIndex() % this.appointments().length;
            this.appointments()[index] = apt;
            this.appointments.valueHasMutated();
        },
        owner: this
    });

    this.originalEditedAppointment = {};

    this.goPrevious = function goPrevious() {
        if (this.editMode()) return;

        if (this.currentIndex() === 0)
            this.currentIndex(this.appointments().length - 1);
        else
            this.currentIndex((this.currentIndex() - 1) % this.appointments().length);
    };

    this.goNext = function goNext() {
        if (this.editMode()) return;

        this.currentIndex((this.currentIndex() + 1) % this.appointments().length);
    };

    this.edit = function edit() {
        this.editMode(true);
    }.bind(this);

    this.cancel = function cancel() {

        // if is new, discard
        if (this.isNew()) {
            this.newAppointment(null);
        }
        else {
            // revert changes
            this.currentAppointment(new Appointment(this.originalEditedAppointment));
        }

        this.editMode(false);
    }.bind(this);

    this.save = function save() {
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
    }.bind(this);

    this.currentDate = ko.observable(new Date());
    this.currentAppointment.subscribe(function(apt) {

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
    

    // Data Updates
    this.isLoading = ko.observable(false);
    // on currentDate changes:
    // NOTE: Lot of code shared with calendar.js
    var previousDate = this.currentDate();
    previousDate = previousDate && previousDate.toISOString();
    this.currentDate.subscribe(function (date) {
        
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
        
            if (appointmentsList && appointmentsList.length) {
                // Update the source:
                this.appointments(appointmentsList);
                this.isLoading(false);
            }
            else {
                this.appointments([]);
                this.isLoading(false);
            }

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

    }.bind(this));
}

},{"../components/Activity":44,"../components/DatePicker":45,"../models/Appointment":49,"knockout":false,"moment":false}],4:[function(require,module,exports){
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
        id: 0,

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
        link: '#!appointment/' + apt.id(),
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvbm9kZV9tb2R1bGVzL251bWVyYWwvbnVtZXJhbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYWNjb3VudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYXBwb2ludG1lbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2Jvb2tNZUJ1dHRvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYm9va2luZ0NvbmZpcm1hdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY2FsZW5kYXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2NhbGVuZGFyU3luY2luZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY2xpZW50RWRpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY2xpZW50cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY21zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9jb250YWN0Rm9ybS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY29udGFjdEluZm8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2NvbnZlcnNhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvZGF0ZXRpbWVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2ZhcXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2ZlZWRiYWNrLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9mZWVkYmFja0Zvcm0uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2hvbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2luYm94LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9pbmRleC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvam9idGl0bGVzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9sZWFybk1vcmUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2xvY2F0aW9uRWRpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvbG9jYXRpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9sb2dpbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvbG9nb3V0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9vbmJvYXJkaW5nQ29tcGxldGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL29uYm9hcmRpbmdIb21lLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9vbmJvYXJkaW5nUG9zaXRpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9vd25lckluZm8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL3ByaXZhY3lTZXR0aW5ncy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvc2NoZWR1bGluZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvc2NoZWR1bGluZ1ByZWZlcmVuY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9zZXJ2aWNlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvc2lnbnVwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy90ZXh0RWRpdG9yLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy93ZWVrbHlTY2hlZHVsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FwcC1jb21wb25lbnRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYXBwLW5hdmJhci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FwcC5hY3Rpdml0aWVzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYXBwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYXBwLm1vZGFscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FwcC5zaGVsbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2NvbXBvbmVudHMvQWN0aXZpdHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9jb21wb25lbnRzL0RhdGVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9jb21wb25lbnRzL1NtYXJ0TmF2QmFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbG9jYWxlcy9lbi1VUy1MQy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9BZGRyZXNzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0FwcG9pbnRtZW50LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0Jvb2tpbmcuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQm9va2luZ1N1bW1hcnkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQ2FsZW5kYXJFdmVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9DYWxlbmRhclN5bmNpbmcuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQ2xpZW50LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0dldE1vcmUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvSm9iVGl0bGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvSm9iVGl0bGVQcmljaW5nVHlwZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9MaXN0Vmlld0l0ZW0uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvTG9jYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvTWFpbEZvbGRlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9NYXJrZXRwbGFjZVByb2ZpbGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvTWVzc2FnZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9Nb2RlbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9QZXJmb3JtYW5jZVN1bW1hcnkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvUG9zaXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvUHJpY2luZ1R5cGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvUHJpdmFjeVNldHRpbmdzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1NjaGVkdWxpbmdQcmVmZXJlbmNlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9TZXJ2aWNlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1NpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9VcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9Vc2VyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1VzZXJKb2JUaXRsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3Rlc3RkYXRhL2NsaWVudHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9sb2NhdGlvbnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9tZXNzYWdlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3Rlc3RkYXRhL3NlcnZpY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdGVzdGRhdGEvdGltZVNsb3RzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvQ2FjaGVDb250cm9sLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvRnVuY3Rpb24ucHJvdG90eXBlLl9kZWxheWVkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvRnVuY3Rpb24ucHJvdG90eXBlLl9pbmhlcml0cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL01vZGVsVmVyc2lvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL1JlbW90ZU1vZGVsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvUmVzdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL1RpbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9hY2Nlc3NDb250cm9sLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvYXBpSGVscGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvYm9vdGtub2NrQmluZGluZ0hlbHBlcnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9ib290c3RyYXBTd2l0Y2hCaW5kaW5nLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvZXNjYXBlUmVnRXhwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvZXNjYXBlU2VsZWN0b3IuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9nZXRPYnNlcnZhYmxlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvZ2V0VXJsUXVlcnkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9qcXVlcnkubXVsdGlsaW5lLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvanNQcm9wZXJ0aWVzVG9vbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9Eb21JdGVtc01hbmFnZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9TaGVsbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL2Fic29sdXRpemVVcmwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9kZXBlbmRlbmNpZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9oYXNoYmFuZ0hpc3RvcnkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9pbmRleC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL2xvYWRlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL3BhcnNlVXJsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvc2hlbGwvc2FuaXRpemVVcmwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLWFjY291bnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLWV2ZW50cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwuYXBwb2ludG1lbnRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9BcHBNb2RlbC5ib29raW5ncy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwuY2FsZW5kYXJFdmVudHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLmNhbGVuZGFyU3luY2luZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwuaG9tZUFkZHJlc3MuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLmpvYlRpdGxlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLm1hcmtldHBsYWNlUHJvZmlsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwucHJpdmFjeVNldHRpbmdzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9BcHBNb2RlbC5zY2hlZHVsaW5nUHJlZmVyZW5jZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLnNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwudXNlckpvYlByb2ZpbGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLnVzZXJQcm9maWxlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9Gb3JtQ3JlZGVudGlhbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL05hdkFjdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvTmF2QmFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9UaW1lU2xvdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvVXNlckpvYlByb2ZpbGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdnFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeHBCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogbnVtZXJhbC5qc1xuICogdmVyc2lvbiA6IDEuNS4zXG4gKiBhdXRob3IgOiBBZGFtIERyYXBlclxuICogbGljZW5zZSA6IE1JVFxuICogaHR0cDovL2FkYW13ZHJhcGVyLmdpdGh1Yi5jb20vTnVtZXJhbC1qcy9cbiAqL1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBDb25zdGFudHNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICB2YXIgbnVtZXJhbCxcbiAgICAgICAgVkVSU0lPTiA9ICcxLjUuMycsXG4gICAgICAgIC8vIGludGVybmFsIHN0b3JhZ2UgZm9yIGxhbmd1YWdlIGNvbmZpZyBmaWxlc1xuICAgICAgICBsYW5ndWFnZXMgPSB7fSxcbiAgICAgICAgY3VycmVudExhbmd1YWdlID0gJ2VuJyxcbiAgICAgICAgemVyb0Zvcm1hdCA9IG51bGwsXG4gICAgICAgIGRlZmF1bHRGb3JtYXQgPSAnMCwwJyxcbiAgICAgICAgLy8gY2hlY2sgZm9yIG5vZGVKU1xuICAgICAgICBoYXNNb2R1bGUgPSAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpO1xuXG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIENvbnN0cnVjdG9yc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4gICAgLy8gTnVtZXJhbCBwcm90b3R5cGUgb2JqZWN0XG4gICAgZnVuY3Rpb24gTnVtZXJhbCAobnVtYmVyKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gbnVtYmVyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEltcGxlbWVudGF0aW9uIG9mIHRvRml4ZWQoKSB0aGF0IHRyZWF0cyBmbG9hdHMgbW9yZSBsaWtlIGRlY2ltYWxzXG4gICAgICpcbiAgICAgKiBGaXhlcyBiaW5hcnkgcm91bmRpbmcgaXNzdWVzIChlZy4gKDAuNjE1KS50b0ZpeGVkKDIpID09PSAnMC42MScpIHRoYXQgcHJlc2VudFxuICAgICAqIHByb2JsZW1zIGZvciBhY2NvdW50aW5nLSBhbmQgZmluYW5jZS1yZWxhdGVkIHNvZnR3YXJlLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRvRml4ZWQgKHZhbHVlLCBwcmVjaXNpb24sIHJvdW5kaW5nRnVuY3Rpb24sIG9wdGlvbmFscykge1xuICAgICAgICB2YXIgcG93ZXIgPSBNYXRoLnBvdygxMCwgcHJlY2lzaW9uKSxcbiAgICAgICAgICAgIG9wdGlvbmFsc1JlZ0V4cCxcbiAgICAgICAgICAgIG91dHB1dDtcbiAgICAgICAgICAgIFxuICAgICAgICAvL3JvdW5kaW5nRnVuY3Rpb24gPSAocm91bmRpbmdGdW5jdGlvbiAhPT0gdW5kZWZpbmVkID8gcm91bmRpbmdGdW5jdGlvbiA6IE1hdGgucm91bmQpO1xuICAgICAgICAvLyBNdWx0aXBseSB1cCBieSBwcmVjaXNpb24sIHJvdW5kIGFjY3VyYXRlbHksIHRoZW4gZGl2aWRlIGFuZCB1c2UgbmF0aXZlIHRvRml4ZWQoKTpcbiAgICAgICAgb3V0cHV0ID0gKHJvdW5kaW5nRnVuY3Rpb24odmFsdWUgKiBwb3dlcikgLyBwb3dlcikudG9GaXhlZChwcmVjaXNpb24pO1xuXG4gICAgICAgIGlmIChvcHRpb25hbHMpIHtcbiAgICAgICAgICAgIG9wdGlvbmFsc1JlZ0V4cCA9IG5ldyBSZWdFeHAoJzB7MSwnICsgb3B0aW9uYWxzICsgJ30kJyk7XG4gICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZShvcHRpb25hbHNSZWdFeHAsICcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBGb3JtYXR0aW5nXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgLy8gZGV0ZXJtaW5lIHdoYXQgdHlwZSBvZiBmb3JtYXR0aW5nIHdlIG5lZWQgdG8gZG9cbiAgICBmdW5jdGlvbiBmb3JtYXROdW1lcmFsIChuLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIG91dHB1dDtcblxuICAgICAgICAvLyBmaWd1cmUgb3V0IHdoYXQga2luZCBvZiBmb3JtYXQgd2UgYXJlIGRlYWxpbmcgd2l0aFxuICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyQnKSA+IC0xKSB7IC8vIGN1cnJlbmN5ISEhISFcbiAgICAgICAgICAgIG91dHB1dCA9IGZvcm1hdEN1cnJlbmN5KG4sIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0LmluZGV4T2YoJyUnKSA+IC0xKSB7IC8vIHBlcmNlbnRhZ2VcbiAgICAgICAgICAgIG91dHB1dCA9IGZvcm1hdFBlcmNlbnRhZ2UobiwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgfSBlbHNlIGlmIChmb3JtYXQuaW5kZXhPZignOicpID4gLTEpIHsgLy8gdGltZVxuICAgICAgICAgICAgb3V0cHV0ID0gZm9ybWF0VGltZShuLCBmb3JtYXQpO1xuICAgICAgICB9IGVsc2UgeyAvLyBwbGFpbiBvbCcgbnVtYmVycyBvciBieXRlc1xuICAgICAgICAgICAgb3V0cHV0ID0gZm9ybWF0TnVtYmVyKG4uX3ZhbHVlLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmV0dXJuIHN0cmluZ1xuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIC8vIHJldmVydCB0byBudW1iZXJcbiAgICBmdW5jdGlvbiB1bmZvcm1hdE51bWVyYWwgKG4sIHN0cmluZykge1xuICAgICAgICB2YXIgc3RyaW5nT3JpZ2luYWwgPSBzdHJpbmcsXG4gICAgICAgICAgICB0aG91c2FuZFJlZ0V4cCxcbiAgICAgICAgICAgIG1pbGxpb25SZWdFeHAsXG4gICAgICAgICAgICBiaWxsaW9uUmVnRXhwLFxuICAgICAgICAgICAgdHJpbGxpb25SZWdFeHAsXG4gICAgICAgICAgICBzdWZmaXhlcyA9IFsnS0InLCAnTUInLCAnR0InLCAnVEInLCAnUEInLCAnRUInLCAnWkInLCAnWUInXSxcbiAgICAgICAgICAgIGJ5dGVzTXVsdGlwbGllciA9IGZhbHNlLFxuICAgICAgICAgICAgcG93ZXI7XG5cbiAgICAgICAgaWYgKHN0cmluZy5pbmRleE9mKCc6JykgPiAtMSkge1xuICAgICAgICAgICAgbi5fdmFsdWUgPSB1bmZvcm1hdFRpbWUoc3RyaW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChzdHJpbmcgPT09IHplcm9Gb3JtYXQpIHtcbiAgICAgICAgICAgICAgICBuLl92YWx1ZSA9IDA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5kZWxpbWl0ZXJzLmRlY2ltYWwgIT09ICcuJykge1xuICAgICAgICAgICAgICAgICAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZSgvXFwuL2csJycpLnJlcGxhY2UobGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uZGVsaW1pdGVycy5kZWNpbWFsLCAnLicpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHNlZSBpZiBhYmJyZXZpYXRpb25zIGFyZSB0aGVyZSBzbyB0aGF0IHdlIGNhbiBtdWx0aXBseSB0byB0aGUgY29ycmVjdCBudW1iZXJcbiAgICAgICAgICAgICAgICB0aG91c2FuZFJlZ0V4cCA9IG5ldyBSZWdFeHAoJ1teYS16QS1aXScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLnRob3VzYW5kICsgJyg/OlxcXFwpfChcXFxcJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCArICcpPyg/OlxcXFwpKT8pPyQnKTtcbiAgICAgICAgICAgICAgICBtaWxsaW9uUmVnRXhwID0gbmV3IFJlZ0V4cCgnW15hLXpBLVpdJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMubWlsbGlvbiArICcoPzpcXFxcKXwoXFxcXCcgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyAnKT8oPzpcXFxcKSk/KT8kJyk7XG4gICAgICAgICAgICAgICAgYmlsbGlvblJlZ0V4cCA9IG5ldyBSZWdFeHAoJ1teYS16QS1aXScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLmJpbGxpb24gKyAnKD86XFxcXCl8KFxcXFwnICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgJyk/KD86XFxcXCkpPyk/JCcpO1xuICAgICAgICAgICAgICAgIHRyaWxsaW9uUmVnRXhwID0gbmV3IFJlZ0V4cCgnW15hLXpBLVpdJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMudHJpbGxpb24gKyAnKD86XFxcXCl8KFxcXFwnICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgJyk/KD86XFxcXCkpPyk/JCcpO1xuXG4gICAgICAgICAgICAgICAgLy8gc2VlIGlmIGJ5dGVzIGFyZSB0aGVyZSBzbyB0aGF0IHdlIGNhbiBtdWx0aXBseSB0byB0aGUgY29ycmVjdCBudW1iZXJcbiAgICAgICAgICAgICAgICBmb3IgKHBvd2VyID0gMDsgcG93ZXIgPD0gc3VmZml4ZXMubGVuZ3RoOyBwb3dlcisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGVzTXVsdGlwbGllciA9IChzdHJpbmcuaW5kZXhPZihzdWZmaXhlc1twb3dlcl0pID4gLTEpID8gTWF0aC5wb3coMTAyNCwgcG93ZXIgKyAxKSA6IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChieXRlc011bHRpcGxpZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gZG8gc29tZSBtYXRoIHRvIGNyZWF0ZSBvdXIgbnVtYmVyXG4gICAgICAgICAgICAgICAgbi5fdmFsdWUgPSAoKGJ5dGVzTXVsdGlwbGllcikgPyBieXRlc011bHRpcGxpZXIgOiAxKSAqICgoc3RyaW5nT3JpZ2luYWwubWF0Y2godGhvdXNhbmRSZWdFeHApKSA/IE1hdGgucG93KDEwLCAzKSA6IDEpICogKChzdHJpbmdPcmlnaW5hbC5tYXRjaChtaWxsaW9uUmVnRXhwKSkgPyBNYXRoLnBvdygxMCwgNikgOiAxKSAqICgoc3RyaW5nT3JpZ2luYWwubWF0Y2goYmlsbGlvblJlZ0V4cCkpID8gTWF0aC5wb3coMTAsIDkpIDogMSkgKiAoKHN0cmluZ09yaWdpbmFsLm1hdGNoKHRyaWxsaW9uUmVnRXhwKSkgPyBNYXRoLnBvdygxMCwgMTIpIDogMSkgKiAoKHN0cmluZy5pbmRleE9mKCclJykgPiAtMSkgPyAwLjAxIDogMSkgKiAoKChzdHJpbmcuc3BsaXQoJy0nKS5sZW5ndGggKyBNYXRoLm1pbihzdHJpbmcuc3BsaXQoJygnKS5sZW5ndGgtMSwgc3RyaW5nLnNwbGl0KCcpJykubGVuZ3RoLTEpKSAlIDIpPyAxOiAtMSkgKiBOdW1iZXIoc3RyaW5nLnJlcGxhY2UoL1teMC05XFwuXSsvZywgJycpKTtcblxuICAgICAgICAgICAgICAgIC8vIHJvdW5kIGlmIHdlIGFyZSB0YWxraW5nIGFib3V0IGJ5dGVzXG4gICAgICAgICAgICAgICAgbi5fdmFsdWUgPSAoYnl0ZXNNdWx0aXBsaWVyKSA/IE1hdGguY2VpbChuLl92YWx1ZSkgOiBuLl92YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbi5fdmFsdWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0Q3VycmVuY3kgKG4sIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbikge1xuICAgICAgICB2YXIgc3ltYm9sSW5kZXggPSBmb3JtYXQuaW5kZXhPZignJCcpLFxuICAgICAgICAgICAgb3BlblBhcmVuSW5kZXggPSBmb3JtYXQuaW5kZXhPZignKCcpLFxuICAgICAgICAgICAgbWludXNTaWduSW5kZXggPSBmb3JtYXQuaW5kZXhPZignLScpLFxuICAgICAgICAgICAgc3BhY2UgPSAnJyxcbiAgICAgICAgICAgIHNwbGljZUluZGV4LFxuICAgICAgICAgICAgb3V0cHV0O1xuXG4gICAgICAgIC8vIGNoZWNrIGZvciBzcGFjZSBiZWZvcmUgb3IgYWZ0ZXIgY3VycmVuY3lcbiAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcgJCcpID4gLTEpIHtcbiAgICAgICAgICAgIHNwYWNlID0gJyAnO1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyAkJywgJycpO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdC5pbmRleE9mKCckICcpID4gLTEpIHtcbiAgICAgICAgICAgIHNwYWNlID0gJyAnO1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyQgJywgJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyQnLCAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBmb3JtYXQgdGhlIG51bWJlclxuICAgICAgICBvdXRwdXQgPSBmb3JtYXROdW1iZXIobi5fdmFsdWUsIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbik7XG5cbiAgICAgICAgLy8gcG9zaXRpb24gdGhlIHN5bWJvbFxuICAgICAgICBpZiAoc3ltYm9sSW5kZXggPD0gMSkge1xuICAgICAgICAgICAgaWYgKG91dHB1dC5pbmRleE9mKCcoJykgPiAtMSB8fCBvdXRwdXQuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQuc3BsaXQoJycpO1xuICAgICAgICAgICAgICAgIHNwbGljZUluZGV4ID0gMTtcbiAgICAgICAgICAgICAgICBpZiAoc3ltYm9sSW5kZXggPCBvcGVuUGFyZW5JbmRleCB8fCBzeW1ib2xJbmRleCA8IG1pbnVzU2lnbkluZGV4KXtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHN5bWJvbCBhcHBlYXJzIGJlZm9yZSB0aGUgXCIoXCIgb3IgXCItXCJcbiAgICAgICAgICAgICAgICAgICAgc3BsaWNlSW5kZXggPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvdXRwdXQuc3BsaWNlKHNwbGljZUluZGV4LCAwLCBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyBzcGFjZSk7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LmpvaW4oJycpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyBzcGFjZSArIG91dHB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChvdXRwdXQuaW5kZXhPZignKScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQuc3BsaXQoJycpO1xuICAgICAgICAgICAgICAgIG91dHB1dC5zcGxpY2UoLTEsIDAsIHNwYWNlICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sKTtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQuam9pbignJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dCArIHNwYWNlICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXRQZXJjZW50YWdlIChuLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIHNwYWNlID0gJycsXG4gICAgICAgICAgICBvdXRwdXQsXG4gICAgICAgICAgICB2YWx1ZSA9IG4uX3ZhbHVlICogMTAwO1xuXG4gICAgICAgIC8vIGNoZWNrIGZvciBzcGFjZSBiZWZvcmUgJVxuICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyAlJykgPiAtMSkge1xuICAgICAgICAgICAgc3BhY2UgPSAnICc7XG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnICUnLCAnJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnJScsICcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG91dHB1dCA9IGZvcm1hdE51bWJlcih2YWx1ZSwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChvdXRwdXQuaW5kZXhPZignKScpID4gLTEgKSB7XG4gICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQuc3BsaXQoJycpO1xuICAgICAgICAgICAgb3V0cHV0LnNwbGljZSgtMSwgMCwgc3BhY2UgKyAnJScpO1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LmpvaW4oJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgc3BhY2UgKyAnJSc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZvcm1hdFRpbWUgKG4pIHtcbiAgICAgICAgdmFyIGhvdXJzID0gTWF0aC5mbG9vcihuLl92YWx1ZS82MC82MCksXG4gICAgICAgICAgICBtaW51dGVzID0gTWF0aC5mbG9vcigobi5fdmFsdWUgLSAoaG91cnMgKiA2MCAqIDYwKSkvNjApLFxuICAgICAgICAgICAgc2Vjb25kcyA9IE1hdGgucm91bmQobi5fdmFsdWUgLSAoaG91cnMgKiA2MCAqIDYwKSAtIChtaW51dGVzICogNjApKTtcbiAgICAgICAgcmV0dXJuIGhvdXJzICsgJzonICsgKChtaW51dGVzIDwgMTApID8gJzAnICsgbWludXRlcyA6IG1pbnV0ZXMpICsgJzonICsgKChzZWNvbmRzIDwgMTApID8gJzAnICsgc2Vjb25kcyA6IHNlY29uZHMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVuZm9ybWF0VGltZSAoc3RyaW5nKSB7XG4gICAgICAgIHZhciB0aW1lQXJyYXkgPSBzdHJpbmcuc3BsaXQoJzonKSxcbiAgICAgICAgICAgIHNlY29uZHMgPSAwO1xuICAgICAgICAvLyB0dXJuIGhvdXJzIGFuZCBtaW51dGVzIGludG8gc2Vjb25kcyBhbmQgYWRkIHRoZW0gYWxsIHVwXG4gICAgICAgIGlmICh0aW1lQXJyYXkubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICAvLyBob3Vyc1xuICAgICAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgKyAoTnVtYmVyKHRpbWVBcnJheVswXSkgKiA2MCAqIDYwKTtcbiAgICAgICAgICAgIC8vIG1pbnV0ZXNcbiAgICAgICAgICAgIHNlY29uZHMgPSBzZWNvbmRzICsgKE51bWJlcih0aW1lQXJyYXlbMV0pICogNjApO1xuICAgICAgICAgICAgLy8gc2Vjb25kc1xuICAgICAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgKyBOdW1iZXIodGltZUFycmF5WzJdKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aW1lQXJyYXkubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICAvLyBtaW51dGVzXG4gICAgICAgICAgICBzZWNvbmRzID0gc2Vjb25kcyArIChOdW1iZXIodGltZUFycmF5WzBdKSAqIDYwKTtcbiAgICAgICAgICAgIC8vIHNlY29uZHNcbiAgICAgICAgICAgIHNlY29uZHMgPSBzZWNvbmRzICsgTnVtYmVyKHRpbWVBcnJheVsxXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE51bWJlcihzZWNvbmRzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXROdW1iZXIgKHZhbHVlLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIG5lZ1AgPSBmYWxzZSxcbiAgICAgICAgICAgIHNpZ25lZCA9IGZhbHNlLFxuICAgICAgICAgICAgb3B0RGVjID0gZmFsc2UsXG4gICAgICAgICAgICBhYmJyID0gJycsXG4gICAgICAgICAgICBhYmJySyA9IGZhbHNlLCAvLyBmb3JjZSBhYmJyZXZpYXRpb24gdG8gdGhvdXNhbmRzXG4gICAgICAgICAgICBhYmJyTSA9IGZhbHNlLCAvLyBmb3JjZSBhYmJyZXZpYXRpb24gdG8gbWlsbGlvbnNcbiAgICAgICAgICAgIGFiYnJCID0gZmFsc2UsIC8vIGZvcmNlIGFiYnJldmlhdGlvbiB0byBiaWxsaW9uc1xuICAgICAgICAgICAgYWJiclQgPSBmYWxzZSwgLy8gZm9yY2UgYWJicmV2aWF0aW9uIHRvIHRyaWxsaW9uc1xuICAgICAgICAgICAgYWJickZvcmNlID0gZmFsc2UsIC8vIGZvcmNlIGFiYnJldmlhdGlvblxuICAgICAgICAgICAgYnl0ZXMgPSAnJyxcbiAgICAgICAgICAgIG9yZCA9ICcnLFxuICAgICAgICAgICAgYWJzID0gTWF0aC5hYnModmFsdWUpLFxuICAgICAgICAgICAgc3VmZml4ZXMgPSBbJ0InLCAnS0InLCAnTUInLCAnR0InLCAnVEInLCAnUEInLCAnRUInLCAnWkInLCAnWUInXSxcbiAgICAgICAgICAgIG1pbixcbiAgICAgICAgICAgIG1heCxcbiAgICAgICAgICAgIHBvd2VyLFxuICAgICAgICAgICAgdyxcbiAgICAgICAgICAgIHByZWNpc2lvbixcbiAgICAgICAgICAgIHRob3VzYW5kcyxcbiAgICAgICAgICAgIGQgPSAnJyxcbiAgICAgICAgICAgIG5lZyA9IGZhbHNlO1xuXG4gICAgICAgIC8vIGNoZWNrIGlmIG51bWJlciBpcyB6ZXJvIGFuZCBhIGN1c3RvbSB6ZXJvIGZvcm1hdCBoYXMgYmVlbiBzZXRcbiAgICAgICAgaWYgKHZhbHVlID09PSAwICYmIHplcm9Gb3JtYXQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB6ZXJvRm9ybWF0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gc2VlIGlmIHdlIHNob3VsZCB1c2UgcGFyZW50aGVzZXMgZm9yIG5lZ2F0aXZlIG51bWJlciBvciBpZiB3ZSBzaG91bGQgcHJlZml4IHdpdGggYSBzaWduXG4gICAgICAgICAgICAvLyBpZiBib3RoIGFyZSBwcmVzZW50IHdlIGRlZmF1bHQgdG8gcGFyZW50aGVzZXNcbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignKCcpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBuZWdQID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQuc2xpY2UoMSwgLTEpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmb3JtYXQuaW5kZXhPZignKycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBzaWduZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKC9cXCsvZywgJycpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzZWUgaWYgYWJicmV2aWF0aW9uIGlzIHdhbnRlZFxuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCdhJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIGFiYnJldmlhdGlvbiBpcyBzcGVjaWZpZWRcbiAgICAgICAgICAgICAgICBhYmJySyA9IGZvcm1hdC5pbmRleE9mKCdhSycpID49IDA7XG4gICAgICAgICAgICAgICAgYWJick0gPSBmb3JtYXQuaW5kZXhPZignYU0nKSA+PSAwO1xuICAgICAgICAgICAgICAgIGFiYnJCID0gZm9ybWF0LmluZGV4T2YoJ2FCJykgPj0gMDtcbiAgICAgICAgICAgICAgICBhYmJyVCA9IGZvcm1hdC5pbmRleE9mKCdhVCcpID49IDA7XG4gICAgICAgICAgICAgICAgYWJickZvcmNlID0gYWJicksgfHwgYWJick0gfHwgYWJickIgfHwgYWJiclQ7XG5cbiAgICAgICAgICAgICAgICAvLyBjaGVjayBmb3Igc3BhY2UgYmVmb3JlIGFiYnJldmlhdGlvblxuICAgICAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignIGEnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGFiYnIgPSAnICc7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCcgYScsICcnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnYScsICcnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYWJzID49IE1hdGgucG93KDEwLCAxMikgJiYgIWFiYnJGb3JjZSB8fCBhYmJyVCkge1xuICAgICAgICAgICAgICAgICAgICAvLyB0cmlsbGlvblxuICAgICAgICAgICAgICAgICAgICBhYmJyID0gYWJiciArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMudHJpbGxpb247XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgMTIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYWJzIDwgTWF0aC5wb3coMTAsIDEyKSAmJiBhYnMgPj0gTWF0aC5wb3coMTAsIDkpICYmICFhYmJyRm9yY2UgfHwgYWJickIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYmlsbGlvblxuICAgICAgICAgICAgICAgICAgICBhYmJyID0gYWJiciArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMuYmlsbGlvbjtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KDEwLCA5KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFicyA8IE1hdGgucG93KDEwLCA5KSAmJiBhYnMgPj0gTWF0aC5wb3coMTAsIDYpICYmICFhYmJyRm9yY2UgfHwgYWJick0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbWlsbGlvblxuICAgICAgICAgICAgICAgICAgICBhYmJyID0gYWJiciArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMubWlsbGlvbjtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KDEwLCA2KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFicyA8IE1hdGgucG93KDEwLCA2KSAmJiBhYnMgPj0gTWF0aC5wb3coMTAsIDMpICYmICFhYmJyRm9yY2UgfHwgYWJickspIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhvdXNhbmRcbiAgICAgICAgICAgICAgICAgICAgYWJiciA9IGFiYnIgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLnRob3VzYW5kO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gTWF0aC5wb3coMTAsIDMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2VlIGlmIHdlIGFyZSBmb3JtYXR0aW5nIGJ5dGVzXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJ2InKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgZm9yIHNwYWNlIGJlZm9yZVxuICAgICAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignIGInKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGVzID0gJyAnO1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnIGInLCAnJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJ2InLCAnJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yIChwb3dlciA9IDA7IHBvd2VyIDw9IHN1ZmZpeGVzLmxlbmd0aDsgcG93ZXIrKykge1xuICAgICAgICAgICAgICAgICAgICBtaW4gPSBNYXRoLnBvdygxMDI0LCBwb3dlcik7XG4gICAgICAgICAgICAgICAgICAgIG1heCA9IE1hdGgucG93KDEwMjQsIHBvd2VyKzEpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA+PSBtaW4gJiYgdmFsdWUgPCBtYXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ5dGVzID0gYnl0ZXMgKyBzdWZmaXhlc1twb3dlcl07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWluID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBtaW47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2VlIGlmIG9yZGluYWwgaXMgd2FudGVkXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJ28nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgZm9yIHNwYWNlIGJlZm9yZVxuICAgICAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignIG8nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIG9yZCA9ICcgJztcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyBvJywgJycpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCdvJywgJycpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG9yZCA9IG9yZCArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLm9yZGluYWwodmFsdWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJ1suXScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBvcHREZWMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCdbLl0nLCAnLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB3ID0gdmFsdWUudG9TdHJpbmcoKS5zcGxpdCgnLicpWzBdO1xuICAgICAgICAgICAgcHJlY2lzaW9uID0gZm9ybWF0LnNwbGl0KCcuJylbMV07XG4gICAgICAgICAgICB0aG91c2FuZHMgPSBmb3JtYXQuaW5kZXhPZignLCcpO1xuXG4gICAgICAgICAgICBpZiAocHJlY2lzaW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHByZWNpc2lvbi5pbmRleE9mKCdbJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBwcmVjaXNpb24gPSBwcmVjaXNpb24ucmVwbGFjZSgnXScsICcnKTtcbiAgICAgICAgICAgICAgICAgICAgcHJlY2lzaW9uID0gcHJlY2lzaW9uLnNwbGl0KCdbJyk7XG4gICAgICAgICAgICAgICAgICAgIGQgPSB0b0ZpeGVkKHZhbHVlLCAocHJlY2lzaW9uWzBdLmxlbmd0aCArIHByZWNpc2lvblsxXS5sZW5ndGgpLCByb3VuZGluZ0Z1bmN0aW9uLCBwcmVjaXNpb25bMV0ubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkID0gdG9GaXhlZCh2YWx1ZSwgcHJlY2lzaW9uLmxlbmd0aCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdyA9IGQuc3BsaXQoJy4nKVswXTtcblxuICAgICAgICAgICAgICAgIGlmIChkLnNwbGl0KCcuJylbMV0ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGQgPSBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5kZWxpbWl0ZXJzLmRlY2ltYWwgKyBkLnNwbGl0KCcuJylbMV07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZCA9ICcnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChvcHREZWMgJiYgTnVtYmVyKGQuc2xpY2UoMSkpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGQgPSAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHcgPSB0b0ZpeGVkKHZhbHVlLCBudWxsLCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZm9ybWF0IG51bWJlclxuICAgICAgICAgICAgaWYgKHcuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICB3ID0gdy5zbGljZSgxKTtcbiAgICAgICAgICAgICAgICBuZWcgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhvdXNhbmRzID4gLTEpIHtcbiAgICAgICAgICAgICAgICB3ID0gdy50b1N0cmluZygpLnJlcGxhY2UoLyhcXGQpKD89KFxcZHszfSkrKD8hXFxkKSkvZywgJyQxJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmRlbGltaXRlcnMudGhvdXNhbmRzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcuJykgPT09IDApIHtcbiAgICAgICAgICAgICAgICB3ID0gJyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAoKG5lZ1AgJiYgbmVnKSA/ICcoJyA6ICcnKSArICgoIW5lZ1AgJiYgbmVnKSA/ICctJyA6ICcnKSArICgoIW5lZyAmJiBzaWduZWQpID8gJysnIDogJycpICsgdyArIGQgKyAoKG9yZCkgPyBvcmQgOiAnJykgKyAoKGFiYnIpID8gYWJiciA6ICcnKSArICgoYnl0ZXMpID8gYnl0ZXMgOiAnJykgKyAoKG5lZ1AgJiYgbmVnKSA/ICcpJyA6ICcnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgVG9wIExldmVsIEZ1bmN0aW9uc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIG51bWVyYWwgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgaWYgKG51bWVyYWwuaXNOdW1lcmFsKGlucHV0KSkge1xuICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC52YWx1ZSgpO1xuICAgICAgICB9IGVsc2UgaWYgKGlucHV0ID09PSAwIHx8IHR5cGVvZiBpbnB1dCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlucHV0ID0gMDtcbiAgICAgICAgfSBlbHNlIGlmICghTnVtYmVyKGlucHV0KSkge1xuICAgICAgICAgICAgaW5wdXQgPSBudW1lcmFsLmZuLnVuZm9ybWF0KGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgTnVtZXJhbChOdW1iZXIoaW5wdXQpKTtcbiAgICB9O1xuXG4gICAgLy8gdmVyc2lvbiBudW1iZXJcbiAgICBudW1lcmFsLnZlcnNpb24gPSBWRVJTSU9OO1xuXG4gICAgLy8gY29tcGFyZSBudW1lcmFsIG9iamVjdFxuICAgIG51bWVyYWwuaXNOdW1lcmFsID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgTnVtZXJhbDtcbiAgICB9O1xuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiB3aWxsIGxvYWQgbGFuZ3VhZ2VzIGFuZCB0aGVuIHNldCB0aGUgZ2xvYmFsIGxhbmd1YWdlLiAgSWZcbiAgICAvLyBubyBhcmd1bWVudHMgYXJlIHBhc3NlZCBpbiwgaXQgd2lsbCBzaW1wbHkgcmV0dXJuIHRoZSBjdXJyZW50IGdsb2JhbFxuICAgIC8vIGxhbmd1YWdlIGtleS5cbiAgICBudW1lcmFsLmxhbmd1YWdlID0gZnVuY3Rpb24gKGtleSwgdmFsdWVzKSB7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudExhbmd1YWdlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGtleSAmJiAhdmFsdWVzKSB7XG4gICAgICAgICAgICBpZighbGFuZ3VhZ2VzW2tleV0pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gbGFuZ3VhZ2UgOiAnICsga2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnJlbnRMYW5ndWFnZSA9IGtleTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZXMgfHwgIWxhbmd1YWdlc1trZXldKSB7XG4gICAgICAgICAgICBsb2FkTGFuZ3VhZ2Uoa2V5LCB2YWx1ZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bWVyYWw7XG4gICAgfTtcbiAgICBcbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHByb3ZpZGVzIGFjY2VzcyB0byB0aGUgbG9hZGVkIGxhbmd1YWdlIGRhdGEuICBJZlxuICAgIC8vIG5vIGFyZ3VtZW50cyBhcmUgcGFzc2VkIGluLCBpdCB3aWxsIHNpbXBseSByZXR1cm4gdGhlIGN1cnJlbnRcbiAgICAvLyBnbG9iYWwgbGFuZ3VhZ2Ugb2JqZWN0LlxuICAgIG51bWVyYWwubGFuZ3VhZ2VEYXRhID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIWxhbmd1YWdlc1trZXldKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gbGFuZ3VhZ2UgOiAnICsga2V5KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGxhbmd1YWdlc1trZXldO1xuICAgIH07XG5cbiAgICBudW1lcmFsLmxhbmd1YWdlKCdlbicsIHtcbiAgICAgICAgZGVsaW1pdGVyczoge1xuICAgICAgICAgICAgdGhvdXNhbmRzOiAnLCcsXG4gICAgICAgICAgICBkZWNpbWFsOiAnLidcbiAgICAgICAgfSxcbiAgICAgICAgYWJicmV2aWF0aW9uczoge1xuICAgICAgICAgICAgdGhvdXNhbmQ6ICdrJyxcbiAgICAgICAgICAgIG1pbGxpb246ICdtJyxcbiAgICAgICAgICAgIGJpbGxpb246ICdiJyxcbiAgICAgICAgICAgIHRyaWxsaW9uOiAndCdcbiAgICAgICAgfSxcbiAgICAgICAgb3JkaW5hbDogZnVuY3Rpb24gKG51bWJlcikge1xuICAgICAgICAgICAgdmFyIGIgPSBudW1iZXIgJSAxMDtcbiAgICAgICAgICAgIHJldHVybiAofn4gKG51bWJlciAlIDEwMCAvIDEwKSA9PT0gMSkgPyAndGgnIDpcbiAgICAgICAgICAgICAgICAoYiA9PT0gMSkgPyAnc3QnIDpcbiAgICAgICAgICAgICAgICAoYiA9PT0gMikgPyAnbmQnIDpcbiAgICAgICAgICAgICAgICAoYiA9PT0gMykgPyAncmQnIDogJ3RoJztcbiAgICAgICAgfSxcbiAgICAgICAgY3VycmVuY3k6IHtcbiAgICAgICAgICAgIHN5bWJvbDogJyQnXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIG51bWVyYWwuemVyb0Zvcm1hdCA9IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgemVyb0Zvcm1hdCA9IHR5cGVvZihmb3JtYXQpID09PSAnc3RyaW5nJyA/IGZvcm1hdCA6IG51bGw7XG4gICAgfTtcblxuICAgIG51bWVyYWwuZGVmYXVsdEZvcm1hdCA9IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgZGVmYXVsdEZvcm1hdCA9IHR5cGVvZihmb3JtYXQpID09PSAnc3RyaW5nJyA/IGZvcm1hdCA6ICcwLjAnO1xuICAgIH07XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEhlbHBlcnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICBmdW5jdGlvbiBsb2FkTGFuZ3VhZ2Uoa2V5LCB2YWx1ZXMpIHtcbiAgICAgICAgbGFuZ3VhZ2VzW2tleV0gPSB2YWx1ZXM7XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBGbG9hdGluZy1wb2ludCBoZWxwZXJzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgLy8gVGhlIGZsb2F0aW5nLXBvaW50IGhlbHBlciBmdW5jdGlvbnMgYW5kIGltcGxlbWVudGF0aW9uXG4gICAgLy8gYm9ycm93cyBoZWF2aWx5IGZyb20gc2luZnVsLmpzOiBodHRwOi8vZ3VpcG4uZ2l0aHViLmlvL3NpbmZ1bC5qcy9cblxuICAgIC8qKlxuICAgICAqIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UgZm9yIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBpdFxuICAgICAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L1JlZHVjZSNDb21wYXRpYmlsaXR5XG4gICAgICovXG4gICAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBBcnJheS5wcm90b3R5cGUucmVkdWNlKSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIG9wdF9pbml0aWFsVmFsdWUpIHtcbiAgICAgICAgICAgICd1c2Ugc3RyaWN0JztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKG51bGwgPT09IHRoaXMgfHwgJ3VuZGVmaW5lZCcgPT09IHR5cGVvZiB0aGlzKSB7XG4gICAgICAgICAgICAgICAgLy8gQXQgdGhlIG1vbWVudCBhbGwgbW9kZXJuIGJyb3dzZXJzLCB0aGF0IHN1cHBvcnQgc3RyaWN0IG1vZGUsIGhhdmVcbiAgICAgICAgICAgICAgICAvLyBuYXRpdmUgaW1wbGVtZW50YXRpb24gb2YgQXJyYXkucHJvdG90eXBlLnJlZHVjZS4gRm9yIGluc3RhbmNlLCBJRThcbiAgICAgICAgICAgICAgICAvLyBkb2VzIG5vdCBzdXBwb3J0IHN0cmljdCBtb2RlLCBzbyB0aGlzIGNoZWNrIGlzIGFjdHVhbGx5IHVzZWxlc3MuXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJyYXkucHJvdG90eXBlLnJlZHVjZSBjYWxsZWQgb24gbnVsbCBvciB1bmRlZmluZWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoY2FsbGJhY2sgKyAnIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBpbmRleCxcbiAgICAgICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgICAgICBsZW5ndGggPSB0aGlzLmxlbmd0aCA+Pj4gMCxcbiAgICAgICAgICAgICAgICBpc1ZhbHVlU2V0ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGlmICgxIDwgYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gb3B0X2luaXRpYWxWYWx1ZTtcbiAgICAgICAgICAgICAgICBpc1ZhbHVlU2V0ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChpbmRleCA9IDA7IGxlbmd0aCA+IGluZGV4OyArK2luZGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFzT3duUHJvcGVydHkoaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1ZhbHVlU2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGNhbGxiYWNrKHZhbHVlLCB0aGlzW2luZGV4XSwgaW5kZXgsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB0aGlzW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzVmFsdWVTZXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWlzVmFsdWVTZXQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdSZWR1Y2Ugb2YgZW1wdHkgYXJyYXkgd2l0aCBubyBpbml0aWFsIHZhbHVlJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBcbiAgICAvKipcbiAgICAgKiBDb21wdXRlcyB0aGUgbXVsdGlwbGllciBuZWNlc3NhcnkgdG8gbWFrZSB4ID49IDEsXG4gICAgICogZWZmZWN0aXZlbHkgZWxpbWluYXRpbmcgbWlzY2FsY3VsYXRpb25zIGNhdXNlZCBieVxuICAgICAqIGZpbml0ZSBwcmVjaXNpb24uXG4gICAgICovXG4gICAgZnVuY3Rpb24gbXVsdGlwbGllcih4KSB7XG4gICAgICAgIHZhciBwYXJ0cyA9IHgudG9TdHJpbmcoKS5zcGxpdCgnLicpO1xuICAgICAgICBpZiAocGFydHMubGVuZ3RoIDwgMikge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE1hdGgucG93KDEwLCBwYXJ0c1sxXS5sZW5ndGgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdpdmVuIGEgdmFyaWFibGUgbnVtYmVyIG9mIGFyZ3VtZW50cywgcmV0dXJucyB0aGUgbWF4aW11bVxuICAgICAqIG11bHRpcGxpZXIgdGhhdCBtdXN0IGJlIHVzZWQgdG8gbm9ybWFsaXplIGFuIG9wZXJhdGlvbiBpbnZvbHZpbmdcbiAgICAgKiBhbGwgb2YgdGhlbS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjb3JyZWN0aW9uRmFjdG9yKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiBhcmdzLnJlZHVjZShmdW5jdGlvbiAocHJldiwgbmV4dCkge1xuICAgICAgICAgICAgdmFyIG1wID0gbXVsdGlwbGllcihwcmV2KSxcbiAgICAgICAgICAgICAgICBtbiA9IG11bHRpcGxpZXIobmV4dCk7XG4gICAgICAgIHJldHVybiBtcCA+IG1uID8gbXAgOiBtbjtcbiAgICAgICAgfSwgLUluZmluaXR5KTtcbiAgICB9ICAgICAgICBcblxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBOdW1lcmFsIFByb3RvdHlwZVxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4gICAgbnVtZXJhbC5mbiA9IE51bWVyYWwucHJvdG90eXBlID0ge1xuXG4gICAgICAgIGNsb25lIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bWVyYWwodGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZm9ybWF0IDogZnVuY3Rpb24gKGlucHV0U3RyaW5nLCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0TnVtZXJhbCh0aGlzLCBcbiAgICAgICAgICAgICAgICAgIGlucHV0U3RyaW5nID8gaW5wdXRTdHJpbmcgOiBkZWZhdWx0Rm9ybWF0LCBcbiAgICAgICAgICAgICAgICAgIChyb3VuZGluZ0Z1bmN0aW9uICE9PSB1bmRlZmluZWQpID8gcm91bmRpbmdGdW5jdGlvbiA6IE1hdGgucm91bmRcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgfSxcblxuICAgICAgICB1bmZvcm1hdCA6IGZ1bmN0aW9uIChpbnB1dFN0cmluZykge1xuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dFN0cmluZykgPT09ICdbb2JqZWN0IE51bWJlcl0nKSB7IFxuICAgICAgICAgICAgICAgIHJldHVybiBpbnB1dFN0cmluZzsgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdW5mb3JtYXROdW1lcmFsKHRoaXMsIGlucHV0U3RyaW5nID8gaW5wdXRTdHJpbmcgOiBkZWZhdWx0Rm9ybWF0KTtcbiAgICAgICAgfSxcblxuICAgICAgICB2YWx1ZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICB2YWx1ZU9mIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldCA6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSBOdW1iZXIodmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWRkIDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgY29yckZhY3RvciA9IGNvcnJlY3Rpb25GYWN0b3IuY2FsbChudWxsLCB0aGlzLl92YWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgZnVuY3Rpb24gY2JhY2soYWNjdW0sIGN1cnIsIGN1cnJJLCBPKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjY3VtICsgY29yckZhY3RvciAqIGN1cnI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IFt0aGlzLl92YWx1ZSwgdmFsdWVdLnJlZHVjZShjYmFjaywgMCkgLyBjb3JyRmFjdG9yO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3VidHJhY3QgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBjb3JyRmFjdG9yID0gY29ycmVjdGlvbkZhY3Rvci5jYWxsKG51bGwsIHRoaXMuX3ZhbHVlLCB2YWx1ZSk7XG4gICAgICAgICAgICBmdW5jdGlvbiBjYmFjayhhY2N1bSwgY3VyciwgY3VyckksIE8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWNjdW0gLSBjb3JyRmFjdG9yICogY3VycjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gW3ZhbHVlXS5yZWR1Y2UoY2JhY2ssIHRoaXMuX3ZhbHVlICogY29yckZhY3RvcikgLyBjb3JyRmFjdG9yOyAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbXVsdGlwbHkgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNiYWNrKGFjY3VtLCBjdXJyLCBjdXJySSwgTykge1xuICAgICAgICAgICAgICAgIHZhciBjb3JyRmFjdG9yID0gY29ycmVjdGlvbkZhY3RvcihhY2N1bSwgY3Vycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChhY2N1bSAqIGNvcnJGYWN0b3IpICogKGN1cnIgKiBjb3JyRmFjdG9yKSAvXG4gICAgICAgICAgICAgICAgICAgIChjb3JyRmFjdG9yICogY29yckZhY3Rvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IFt0aGlzLl92YWx1ZSwgdmFsdWVdLnJlZHVjZShjYmFjaywgMSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBkaXZpZGUgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNiYWNrKGFjY3VtLCBjdXJyLCBjdXJySSwgTykge1xuICAgICAgICAgICAgICAgIHZhciBjb3JyRmFjdG9yID0gY29ycmVjdGlvbkZhY3RvcihhY2N1bSwgY3Vycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChhY2N1bSAqIGNvcnJGYWN0b3IpIC8gKGN1cnIgKiBjb3JyRmFjdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gW3RoaXMuX3ZhbHVlLCB2YWx1ZV0ucmVkdWNlKGNiYWNrKTsgICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRpZmZlcmVuY2UgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmFicyhudW1lcmFsKHRoaXMuX3ZhbHVlKS5zdWJ0cmFjdCh2YWx1ZSkudmFsdWUoKSk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEV4cG9zaW5nIE51bWVyYWxcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAvLyBDb21tb25KUyBtb2R1bGUgaXMgZGVmaW5lZFxuICAgIGlmIChoYXNNb2R1bGUpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBudW1lcmFsO1xuICAgIH1cblxuICAgIC8qZ2xvYmFsIGVuZGVyOmZhbHNlICovXG4gICAgaWYgKHR5cGVvZiBlbmRlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gaGVyZSwgYHRoaXNgIG1lYW5zIGB3aW5kb3dgIGluIHRoZSBicm93c2VyLCBvciBgZ2xvYmFsYCBvbiB0aGUgc2VydmVyXG4gICAgICAgIC8vIGFkZCBgbnVtZXJhbGAgYXMgYSBnbG9iYWwgb2JqZWN0IHZpYSBhIHN0cmluZyBpZGVudGlmaWVyLFxuICAgICAgICAvLyBmb3IgQ2xvc3VyZSBDb21waWxlciAnYWR2YW5jZWQnIG1vZGVcbiAgICAgICAgdGhpc1snbnVtZXJhbCddID0gbnVtZXJhbDtcbiAgICB9XG5cbiAgICAvKmdsb2JhbCBkZWZpbmU6ZmFsc2UgKi9cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbXSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bWVyYWw7XG4gICAgICAgIH0pO1xuICAgIH1cbn0pLmNhbGwodGhpcyk7XG4iLCIvKipcbiAgICBBY2NvdW50IGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQWNjb3VudEFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIoJ0FjY291bnQnKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG4iLCIvKiogQ2FsZW5kYXIgYWN0aXZpdHkgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxucmVxdWlyZSgnLi4vY29tcG9uZW50cy9EYXRlUGlja2VyJyk7XHJcblxyXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XHJcblxyXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQXBwb2ludG1lbnRBY3Rpdml0eSgpIHtcclxuICAgIFxyXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuRnJlZWxhbmNlcjsgICAgXHJcbiAgICB0aGlzLm1lbnVJdGVtID0gJ2NhbGVuZGFyJztcclxuICAgIFxyXG4gICAgLy8gQ3JlYXRlIGEgc3BlY2lmaWMgYmFja0FjdGlvbiB0aGF0IHNob3dzIGN1cnJlbnQgZGF0ZVxyXG4gICAgLy8gYW5kIHJldHVybiB0byBjYWxlbmRhciBpbiBjdXJyZW50IGRhdGUuXHJcbiAgICAvLyBMYXRlciBzb21lIG1vcmUgY2hhbmdlcyBhcmUgYXBwbGllZCwgd2l0aCB2aWV3bW9kZWwgcmVhZHlcclxuICAgIHZhciBiYWNrQWN0aW9uID0gbmV3IEFjdGl2aXR5Lk5hdkFjdGlvbih7XHJcbiAgICAgICAgbGluazogJ2NhbGVuZGFyLycsIC8vIFByZXNlcnZlIGxhc3Qgc2xhc2gsIGZvciBsYXRlciB1c2VcclxuICAgICAgICBpY29uOiBBY3Rpdml0eS5OYXZBY3Rpb24uZ29CYWNrLmljb24oKSxcclxuICAgICAgICBpc1RpdGxlOiB0cnVlLFxyXG4gICAgICAgIHRleHQ6ICdDYWxlbmRhcidcclxuICAgIH0pO1xyXG4gICAgdGhpcy5uYXZCYXIgPSBuZXcgQWN0aXZpdHkuTmF2QmFyKHtcclxuICAgICAgICB0aXRsZTogJycsXHJcbiAgICAgICAgbGVmdEFjdGlvbjogYmFja0FjdGlvbixcclxuICAgICAgICByaWdodEFjdGlvbjogQWN0aXZpdHkuTmF2QWN0aW9uLmdvSGVscEluZGV4XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgdGhpcy4kYXBwb2ludG1lbnRWaWV3ID0gdGhpcy4kYWN0aXZpdHkuZmluZCgnI2NhbGVuZGFyQXBwb2ludG1lbnRWaWV3Jyk7XHJcbiAgICB0aGlzLiRjaG9vc2VOZXcgPSAkKCcjY2FsZW5kYXJDaG9vc2VOZXcnKTtcclxuICAgIFxyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcclxuICAgIC8vIFRPRE8gUmVtb3ZlIHRlc3QgRGF0YVxyXG4gICAgLy90aGlzLnZpZXdNb2RlbC5hcHBvaW50bWVudHMocmVxdWlyZSgnLi4vdGVzdGRhdGEvY2FsZW5kYXJBcHBvaW50bWVudHMnKS5hcHBvaW50bWVudHMpO1xyXG4gICAgXHJcbiAgICAvLyBUaGlzIHRpdGxlIHRleHQgaXMgZHluYW1pYywgd2UgbmVlZCB0byByZXBsYWNlIGl0IGJ5IGEgY29tcHV0ZWQgb2JzZXJ2YWJsZVxyXG4gICAgLy8gc2hvd2luZyB0aGUgY3VycmVudCBkYXRlXHJcbiAgICB2YXIgZGVmQmFja1RleHQgPSBiYWNrQWN0aW9uLnRleHQuX2luaXRpYWxWYWx1ZTtcclxuICAgIGJhY2tBY3Rpb24udGV4dCA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgZCA9IHRoaXMudmlld01vZGVsLmN1cnJlbnREYXRlKCk7XHJcbiAgICAgICAgaWYgKCFkKVxyXG4gICAgICAgICAgICAvLyBGYWxsYmFjayB0byB0aGUgZGVmYXVsdCB0aXRsZVxyXG4gICAgICAgICAgICByZXR1cm4gZGVmQmFja1RleHQ7XHJcblxyXG4gICAgICAgIHZhciBtID0gbW9tZW50KGQpO1xyXG4gICAgICAgIHZhciB0ID0gbS5mb3JtYXQoJ2RkZGQgWyhdTS9EWyldJyk7XHJcbiAgICAgICAgcmV0dXJuIHQ7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIC8vIEFuZCB0aGUgbGluayBpcyBkeW5hbWljIHRvbywgdG8gYWxsb3cgcmV0dXJuIHRvIHRoZSBkYXRlXHJcbiAgICAvLyB0aGF0IG1hdGNoZXMgY3VycmVudCBhcHBvaW50bWVudFxyXG4gICAgdmFyIGRlZkxpbmsgPSBiYWNrQWN0aW9uLmxpbmsuX2luaXRpYWxWYWx1ZTtcclxuICAgIGJhY2tBY3Rpb24ubGluayA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgZCA9IHRoaXMudmlld01vZGVsLmN1cnJlbnREYXRlKCk7XHJcbiAgICAgICAgaWYgKCFkKVxyXG4gICAgICAgICAgICAvLyBGYWxsYmFjayB0byB0aGUgZGVmYXVsdCBsaW5rXHJcbiAgICAgICAgICAgIHJldHVybiBkZWZMaW5rO1xyXG5cclxuICAgICAgICByZXR1cm4gZGVmTGluayArIGQudG9JU09TdHJpbmcoKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdNb2RlbC5jdXJyZW50QXBwb2ludG1lbnQsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24gKGFwdCkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKCFhcHQpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBVcGRhdGUgVVJMIHRvIG1hdGNoIHRoZSBhcHBvaW50bWVudCBJRCBhbmRcclxuICAgICAgICAgICAgLy8gdHJhY2sgaXQgc3RhdGVcclxuICAgICAgICAgICAgLy8gR2V0IElEIGZyb20gVVJMLCB0byBhdm9pZCBkbyBhbnl0aGluZyBpZiB0aGUgc2FtZS5cclxuICAgICAgICAgICAgdmFyIGFwdElkID0gYXB0LmlkKCk7XHJcbiAgICAgICAgICAgIHZhciB1cmxJZCA9IC9hcHBvaW50bWVudFxcLyhcXGQrKS9pLnRlc3Qod2luZG93LmxvY2F0aW9uKTtcclxuICAgICAgICAgICAgdXJsSWQgPSB1cmxJZCAmJiB1cmxJZFsxXSB8fCAnJztcclxuICAgICAgICAgICAgaWYgKHVybElkICE9PSAnMCcgJiYgYXB0SWQgIT09IG51bGwgJiYgdXJsSWQgIT09IGFwdElkLnRvU3RyaW5nKCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPIHNhdmUgYSB1c2VmdWwgc3RhdGVcclxuICAgICAgICAgICAgICAgIC8vIE5vdCBmb3Igbm93LCBpcyBmYWlsaW5nLCBidXQgc29tZXRoaW5nIGJhc2VkIG9uOlxyXG4gICAgICAgICAgICAgICAgLypcclxuICAgICAgICAgICAgICAgIHZhciB2aWV3c3RhdGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwb2ludG1lbnQ6IGFwdC5tb2RlbC50b1BsYWluT2JqZWN0KHRydWUpXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgKi9cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiB3YXMgYSByb290IFVSTCwgbm8gSUQsIGp1c3QgcmVwbGFjZSBjdXJyZW50IHN0YXRlXHJcbiAgICAgICAgICAgICAgICBpZiAodXJsSWQgPT09ICcnKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmhpc3RvcnkucmVwbGFjZVN0YXRlKG51bGwsIG51bGwsICdhcHBvaW50bWVudC8nICsgYXB0SWQpO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsICdhcHBvaW50bWVudC8nICsgYXB0SWQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBUcmlnZ2VyIGEgbGF5b3V0IHVwZGF0ZSwgcmVxdWlyZWQgYnkgdGhlIGZ1bGwtaGVpZ2h0IGZlYXR1cmVcclxuICAgICAgICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ2xheW91dFVwZGF0ZScpO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLmVkaXRNb2RlLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGlzRWRpdCkge1xyXG4gICAgICAgICAgICB0aGlzLiRhY3Rpdml0eS50b2dnbGVDbGFzcygnaW4tZWRpdCcsIGlzRWRpdCk7XHJcbiAgICAgICAgICAgIHRoaXMuJGFwcG9pbnRtZW50Vmlldy5maW5kKCcuQXBwb2ludG1lbnRDYXJkJykudG9nZ2xlQ2xhc3MoJ2luLWVkaXQnLCBpc0VkaXQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGlzRWRpdCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGEgY29weSBvZiB0aGUgYXBwb2ludG1lbnQgc28gd2UgcmV2ZXJ0IG9uICdjYW5jZWwnXHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5vcmlnaW5hbEVkaXRlZEFwcG9pbnRtZW50ID0gXHJcbiAgICAgICAgICAgICAgICAgICAga28udG9KUyh0aGlzLnZpZXdNb2RlbC5jdXJyZW50QXBwb2ludG1lbnQoKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcbiAgICAvKiBqc2hpbnQgbWF4Y29tcGxleGl0eToxMCAqL1xyXG5cclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgb3B0aW9ucyk7XHJcbiAgICBcclxuICAgIHZhciBhcHQ7XHJcbiAgICBpZiAodGhpcy5yZXF1ZXN0RGF0YS5hcHBvaW50bWVudCkge1xyXG4gICAgICAgIGFwdCA9IHRoaXMucmVxdWVzdERhdGEuYXBwb2ludG1lbnQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEdldCBJRFxyXG4gICAgICAgIHZhciBhcHRJZCA9IG9wdGlvbnMgJiYgb3B0aW9ucy5yb3V0ZSAmJiBvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdO1xyXG4gICAgICAgIGFwdElkID0gcGFyc2VJbnQoYXB0SWQsIDEwKTtcclxuICAgICAgICBhcHQgPSBhcHRJZCB8fCAwO1xyXG4gICAgfVxyXG4gICAgdGhpcy5zaG93QXBwb2ludG1lbnQoYXB0KTtcclxuICAgIFxyXG4gICAgLy8gSWYgdGhlcmUgYXJlIG9wdGlvbnMgKG1heSBub3QgYmUgb24gc3RhcnR1cCBvclxyXG4gICAgLy8gb24gY2FuY2VsbGVkIGVkaXRpb24pLlxyXG4gICAgaWYgKG9wdGlvbnMgIT09IG51bGwpIHtcclxuXHJcbiAgICAgICAgdmFyIGJvb2tpbmcgPSB0aGlzLnZpZXdNb2RlbC5jdXJyZW50QXBwb2ludG1lbnQoKTtcclxuICAgICAgICAvLyBJdCBjb21lcyBiYWNrIGZyb20gdGhlIHRleHRFZGl0b3IuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMucmVxdWVzdCA9PT0gJ3RleHRFZGl0b3InICYmIGJvb2tpbmcpIHtcclxuXHJcbiAgICAgICAgICAgIGJvb2tpbmdbb3B0aW9ucy5maWVsZF0ob3B0aW9ucy50ZXh0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5zZWxlY3RDbGllbnQgPT09IHRydWUgJiYgYm9va2luZykge1xyXG5cclxuICAgICAgICAgICAgYm9va2luZy5jbGllbnQob3B0aW9ucy5zZWxlY3RlZENsaWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZihvcHRpb25zLnNlbGVjdGVkRGF0ZXRpbWUpICE9PSAndW5kZWZpbmVkJyAmJiBib29raW5nKSB7XHJcblxyXG4gICAgICAgICAgICBib29raW5nLnN0YXJ0VGltZShvcHRpb25zLnNlbGVjdGVkRGF0ZXRpbWUpO1xyXG4gICAgICAgICAgICAvLyBUT0RPIENhbGN1bGF0ZSB0aGUgZW5kVGltZSBnaXZlbiBhbiBhcHBvaW50bWVudCBkdXJhdGlvbiwgcmV0cmlldmVkIGZyb20gdGhlXHJcbiAgICAgICAgICAgIC8vIHNlbGVjdGVkIHNlcnZpY2VcclxuICAgICAgICAgICAgLy92YXIgZHVyYXRpb24gPSBib29raW5nLnByaWNpbmcgJiYgYm9va2luZy5wcmljaW5nLmR1cmF0aW9uO1xyXG4gICAgICAgICAgICAvLyBPciBieSBkZWZhdWx0IChpZiBubyBwcmljaW5nIHNlbGVjdGVkIG9yIGFueSkgdGhlIHVzZXIgcHJlZmVycmVkXHJcbiAgICAgICAgICAgIC8vIHRpbWUgZ2FwXHJcbiAgICAgICAgICAgIC8vZHVyYXRpb24gPSBkdXJhdGlvbiB8fCB1c2VyLnByZWZlcmVuY2VzLnRpbWVTbG90c0dhcDtcclxuICAgICAgICAgICAgLy8gUFJPVE9UWVBFOlxyXG4gICAgICAgICAgICB2YXIgZHVyYXRpb24gPSA2MDsgLy8gbWludXRlc1xyXG4gICAgICAgICAgICBib29raW5nLmVuZFRpbWUobW9tZW50KGJvb2tpbmcuc3RhcnRUaW1lKCkpLmFkZChkdXJhdGlvbiwgJ21pbnV0ZXMnKS50b0RhdGUoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKG9wdGlvbnMuc2VsZWN0U2VydmljZXMgPT09IHRydWUgJiYgYm9va2luZykge1xyXG5cclxuICAgICAgICAgICAgYm9va2luZy5zZXJ2aWNlcyhvcHRpb25zLnNlbGVjdGVkU2VydmljZXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChvcHRpb25zLnNlbGVjdExvY2F0aW9uID09PSB0cnVlICYmIGJvb2tpbmcpIHtcclxuXHJcbiAgICAgICAgICAgIGJvb2tpbmcubG9jYXRpb24ob3B0aW9ucy5zZWxlY3RlZExvY2F0aW9uKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgQXBwb2ludG1lbnQgPSByZXF1aXJlKCcuLi9tb2RlbHMvQXBwb2ludG1lbnQnKTtcclxuXHJcbkEucHJvdG90eXBlLnNob3dBcHBvaW50bWVudCA9IGZ1bmN0aW9uIHNob3dBcHBvaW50bWVudChhcHQpIHtcclxuXHJcbiAgICBpZiAodHlwZW9mKGFwdCkgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgaWYgKGFwdCkge1xyXG4gICAgICAgICAgICAvLyBUT0RPOiBzZWxlY3QgYXBwb2ludG1lbnQgYXB0IElEXHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAoYXB0ID09PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlld01vZGVsLm5ld0FwcG9pbnRtZW50KG5ldyBBcHBvaW50bWVudCgpKTtcclxuICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuZWRpdE1vZGUodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgLy8gQXBwb2ludG1lbnQgb2JqZWN0XHJcbiAgICAgICAgaWYgKGFwdC5pZCkge1xyXG4gICAgICAgICAgICAvLyBUT0RPOiBzZWxlY3QgYXBwb2ludG1lbnQgYnkgYXB0IGlkXHJcbiAgICAgICAgICAgIC8vIFRPRE86IHRoZW4gdXBkYXRlIHZhbHVlcyB3aXRoIGluLWVkaXRpbmcgdmFsdWVzIGZyb20gYXB0XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBOZXcgYXBvcGludG1lbnQgd2l0aCB0aGUgaW4tZWRpdGluZyB2YWx1ZXNcclxuICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwubmV3QXBwb2ludG1lbnQobmV3IEFwcG9pbnRtZW50KGFwdCkpO1xyXG4gICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5lZGl0TW9kZSh0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBnZXREYXRlV2l0aG91dFRpbWUoZGF0ZSkge1xyXG4gICAgZGF0ZSA9IGRhdGUgfHwgbmV3IERhdGUoKTtcclxuICAgIHJldHVybiBuZXcgRGF0ZShcclxuICAgICAgICBkYXRlLmdldEZ1bGxZZWFyKCksXHJcbiAgICAgICAgZGF0ZS5nZXRNb250aCgpLFxyXG4gICAgICAgIGRhdGUuZ2V0RGF0ZSgpLFxyXG4gICAgICAgIDAsIDAsIDBcclxuICAgICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbChhcHApIHtcclxuICAgIC8qanNoaW50IG1heHN0YXRlbWVudHM6IDMwICovXHJcblxyXG4gICAgdGhpcy5hcHBvaW50bWVudHMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xyXG4gICAgdGhpcy5jdXJyZW50SW5kZXggPSBrby5vYnNlcnZhYmxlKDApO1xyXG4gICAgdGhpcy5lZGl0TW9kZSA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgdGhpcy5uZXdBcHBvaW50bWVudCA9IGtvLm9ic2VydmFibGUobnVsbCk7XHJcbiAgICB0aGlzLm5vQXBwb2ludG1lbnQgPSBuZXcgQXBwb2ludG1lbnQoe1xyXG4gICAgICAgIGlkOiAtMSxcclxuICAgICAgICBzdW1tYXJ5OiAnVGhlcmUgaXMgbm8gYXBwb2ludG1lbnRzIG9uIHRoaXMgZGF0ZSdcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuaXNOZXcgPSBrby5jb21wdXRlZChmdW5jdGlvbigpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5ld0FwcG9pbnRtZW50KCkgIT09IG51bGw7XHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLmN1cnJlbnRBcHBvaW50bWVudCA9IGtvLmNvbXB1dGVkKHtcclxuICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXNOZXcoKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV3QXBwb2ludG1lbnQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcHQgPSB0aGlzLmFwcG9pbnRtZW50cygpW3RoaXMuY3VycmVudEluZGV4KCkgJSB0aGlzLmFwcG9pbnRtZW50cygpLmxlbmd0aF07XHJcbiAgICAgICAgICAgICAgICBpZiAoIWFwdClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5ub0FwcG9pbnRtZW50O1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFwdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKGFwdCkge1xyXG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmN1cnJlbnRJbmRleCgpICUgdGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGg7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwb2ludG1lbnRzKClbaW5kZXhdID0gYXB0O1xyXG4gICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50cy52YWx1ZUhhc011dGF0ZWQoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG93bmVyOiB0aGlzXHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLm9yaWdpbmFsRWRpdGVkQXBwb2ludG1lbnQgPSB7fTtcclxuXHJcbiAgICB0aGlzLmdvUHJldmlvdXMgPSBmdW5jdGlvbiBnb1ByZXZpb3VzKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmVkaXRNb2RlKCkpIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudEluZGV4KCkgPT09IDApXHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEluZGV4KHRoaXMuYXBwb2ludG1lbnRzKCkubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCgodGhpcy5jdXJyZW50SW5kZXgoKSAtIDEpICUgdGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGgpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdvTmV4dCA9IGZ1bmN0aW9uIGdvTmV4dCgpIHtcclxuICAgICAgICBpZiAodGhpcy5lZGl0TW9kZSgpKSByZXR1cm47XHJcblxyXG4gICAgICAgIHRoaXMuY3VycmVudEluZGV4KCh0aGlzLmN1cnJlbnRJbmRleCgpICsgMSkgJSB0aGlzLmFwcG9pbnRtZW50cygpLmxlbmd0aCk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZWRpdCA9IGZ1bmN0aW9uIGVkaXQoKSB7XHJcbiAgICAgICAgdGhpcy5lZGl0TW9kZSh0cnVlKTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLmNhbmNlbCA9IGZ1bmN0aW9uIGNhbmNlbCgpIHtcclxuXHJcbiAgICAgICAgLy8gaWYgaXMgbmV3LCBkaXNjYXJkXHJcbiAgICAgICAgaWYgKHRoaXMuaXNOZXcoKSkge1xyXG4gICAgICAgICAgICB0aGlzLm5ld0FwcG9pbnRtZW50KG51bGwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gcmV2ZXJ0IGNoYW5nZXNcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50QXBwb2ludG1lbnQobmV3IEFwcG9pbnRtZW50KHRoaXMub3JpZ2luYWxFZGl0ZWRBcHBvaW50bWVudCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5lZGl0TW9kZShmYWxzZSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcblxyXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgICAgICAvLyBJZiBpcyBhIG5ldyBvbmUsIGFkZCBpdCB0byB0aGUgY29sbGVjdGlvblxyXG4gICAgICAgIGlmICh0aGlzLmlzTmV3KCkpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBuZXdBcHQgPSB0aGlzLm5ld0FwcG9pbnRtZW50KCk7XHJcbiAgICAgICAgICAgIC8vIFRPRE86IHNvbWUgZmllZHMgbmVlZCBzb21lIGtpbmQgb2YgY2FsY3VsYXRpb24gdGhhdCBpcyBwZXJzaXN0ZWRcclxuICAgICAgICAgICAgLy8gc29uIGNhbm5vdCBiZSBjb21wdXRlZC4gU2ltdWxhdGVkOlxyXG4gICAgICAgICAgICBuZXdBcHQuc3VtbWFyeSgnTWFzc2FnZSBUaGVyYXBpc3QgQm9va2luZycpO1xyXG4gICAgICAgICAgICBuZXdBcHQuaWQoNCk7XHJcblxyXG4gICAgICAgICAgICAvLyBBZGQgdG8gdGhlIGxpc3Q6XHJcbiAgICAgICAgICAgIHRoaXMuYXBwb2ludG1lbnRzLnB1c2gobmV3QXB0KTtcclxuICAgICAgICAgICAgLy8gbm93LCByZXNldFxyXG4gICAgICAgICAgICB0aGlzLm5ld0FwcG9pbnRtZW50KG51bGwpO1xyXG4gICAgICAgICAgICAvLyBjdXJyZW50IGluZGV4IG11c3QgYmUgdGhlIGp1c3QtYWRkZWQgYXB0XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEluZGV4KHRoaXMuYXBwb2ludG1lbnRzKCkubGVuZ3RoIC0gMSk7XHJcblxyXG4gICAgICAgICAgICAvLyBPbiBhZGRpbmcgYSBuZXcgb25lLCB0aGUgY29uZmlybWF0aW9uIHBhZ2UgbXVzdCBiZSBzaG93ZWRcclxuICAgICAgICAgICAgYXBwLnNoZWxsLmdvKCdib29raW5nQ29uZmlybWF0aW9uJywge1xyXG4gICAgICAgICAgICAgICAgYm9va2luZzogbmV3QXB0XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5lZGl0TW9kZShmYWxzZSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcblxyXG4gICAgdGhpcy5jdXJyZW50RGF0ZSA9IGtvLm9ic2VydmFibGUobmV3IERhdGUoKSk7XHJcbiAgICB0aGlzLmN1cnJlbnRBcHBvaW50bWVudC5zdWJzY3JpYmUoZnVuY3Rpb24oYXB0KSB7XHJcblxyXG4gICAgICAgIHZhciBuZXdEYXRlID0gbnVsbCxcclxuICAgICAgICAgICAgY3VyRGF0ZSA9IHRoaXMuY3VycmVudERhdGUoKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoYXB0ICYmIGFwdC5zdGFydFRpbWUoKSlcclxuICAgICAgICAgICAgbmV3RGF0ZSA9IGdldERhdGVXaXRob3V0VGltZShhcHQuc3RhcnRUaW1lKCkpO1xyXG5cclxuICAgICAgICAvLyBVcGRhdGUgZGF0ZSB3aXRoIHRoZSBuZXcgZnJvbSBjdXJyZW50IGFwcG9pbnRtZW50XHJcbiAgICAgICAgLy8gb3Iga2VlcCB0aGUgY3VycmVudCBkYXRlLCB3aXRoIGxhdGVzdCBmYWxsYmFjayB0byB0aGUgY3VycmVudCBkYXRlXHJcbiAgICAgICAgbmV3RGF0ZSA9IG5ld0RhdGUgfHwgY3VyRGF0ZSB8fCBnZXREYXRlV2l0aG91dFRpbWUoKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAobmV3RGF0ZS50b0lTT1N0cmluZygpICE9PSBjdXJEYXRlLnRvSVNPU3RyaW5nKCkpIHtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50RGF0ZShuZXdEYXRlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAvKipcclxuICAgICAgICBFeHRlcm5hbCBhY3Rpb25zXHJcbiAgICAqKi9cclxuICAgIHZhciBlZGl0RmllbGRPbiA9IGZ1bmN0aW9uIGVkaXRGaWVsZE9uKGFjdGl2aXR5LCBkYXRhKSB7XHJcblxyXG4gICAgICAgIC8vIEluY2x1ZGUgYXBwb2ludG1lbnQgdG8gcmVjb3ZlciBzdGF0ZSBvbiByZXR1cm46XHJcbiAgICAgICAgZGF0YS5hcHBvaW50bWVudCA9IHRoaXMuY3VycmVudEFwcG9pbnRtZW50KCkubW9kZWwudG9QbGFpbk9iamVjdCh0cnVlKTtcclxuXHJcbiAgICAgICAgYXBwLnNoZWxsLmdvKGFjdGl2aXR5LCBkYXRhKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5waWNrRGF0ZVRpbWUgPSBmdW5jdGlvbiBwaWNrRGF0ZVRpbWUoKSB7XHJcblxyXG4gICAgICAgIGVkaXRGaWVsZE9uKCdkYXRldGltZVBpY2tlcicsIHtcclxuICAgICAgICAgICAgc2VsZWN0ZWREYXRldGltZTogbnVsbFxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnBpY2tDbGllbnQgPSBmdW5jdGlvbiBwaWNrQ2xpZW50KCkge1xyXG5cclxuICAgICAgICBlZGl0RmllbGRPbignY2xpZW50cycsIHtcclxuICAgICAgICAgICAgc2VsZWN0Q2xpZW50OiB0cnVlLFxyXG4gICAgICAgICAgICBzZWxlY3RlZENsaWVudDogbnVsbFxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnBpY2tTZXJ2aWNlID0gZnVuY3Rpb24gcGlja1NlcnZpY2UoKSB7XHJcblxyXG4gICAgICAgIGVkaXRGaWVsZE9uKCdzZXJ2aWNlcycsIHtcclxuICAgICAgICAgICAgc2VsZWN0U2VydmljZXM6IHRydWUsXHJcbiAgICAgICAgICAgIHNlbGVjdGVkU2VydmljZXM6IHRoaXMuY3VycmVudEFwcG9pbnRtZW50KCkuc2VydmljZXMoKVxyXG4gICAgICAgIH0pO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG5cclxuICAgIHRoaXMuY2hhbmdlUHJpY2UgPSBmdW5jdGlvbiBjaGFuZ2VQcmljZSgpIHtcclxuICAgICAgICAvLyBUT0RPXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMucGlja0xvY2F0aW9uID0gZnVuY3Rpb24gcGlja0xvY2F0aW9uKCkge1xyXG5cclxuICAgICAgICBlZGl0RmllbGRPbignbG9jYXRpb25zJywge1xyXG4gICAgICAgICAgICBzZWxlY3RMb2NhdGlvbjogdHJ1ZSxcclxuICAgICAgICAgICAgc2VsZWN0ZWRMb2NhdGlvbjogdGhpcy5jdXJyZW50QXBwb2ludG1lbnQoKS5sb2NhdGlvbigpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcblxyXG4gICAgdmFyIHRleHRGaWVsZHNIZWFkZXJzID0ge1xyXG4gICAgICAgIHByZU5vdGVzVG9DbGllbnQ6ICdOb3RlcyB0byBjbGllbnQnLFxyXG4gICAgICAgIHBvc3ROb3Rlc1RvQ2xpZW50OiAnTm90ZXMgdG8gY2xpZW50IChhZnRlcndhcmRzKScsXHJcbiAgICAgICAgcHJlTm90ZXNUb1NlbGY6ICdOb3RlcyB0byBzZWxmJyxcclxuICAgICAgICBwb3N0Tm90ZXNUb1NlbGY6ICdCb29raW5nIHN1bW1hcnknXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZWRpdFRleHRGaWVsZCA9IGZ1bmN0aW9uIGVkaXRUZXh0RmllbGQoZmllbGQpIHtcclxuXHJcbiAgICAgICAgZWRpdEZpZWxkT24oJ3RleHRFZGl0b3InLCB7XHJcbiAgICAgICAgICAgIHJlcXVlc3Q6ICd0ZXh0RWRpdG9yJyxcclxuICAgICAgICAgICAgZmllbGQ6IGZpZWxkLFxyXG4gICAgICAgICAgICB0aXRsZTogdGhpcy5pc05ldygpID8gJ05ldyBib29raW5nJyA6ICdCb29raW5nJyxcclxuICAgICAgICAgICAgaGVhZGVyOiB0ZXh0RmllbGRzSGVhZGVyc1tmaWVsZF0sXHJcbiAgICAgICAgICAgIHRleHQ6IHRoaXMuY3VycmVudEFwcG9pbnRtZW50KClbZmllbGRdKClcclxuICAgICAgICB9KTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuICAgIFxyXG5cclxuICAgIC8vIERhdGEgVXBkYXRlc1xyXG4gICAgdGhpcy5pc0xvYWRpbmcgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuICAgIC8vIG9uIGN1cnJlbnREYXRlIGNoYW5nZXM6XHJcbiAgICAvLyBOT1RFOiBMb3Qgb2YgY29kZSBzaGFyZWQgd2l0aCBjYWxlbmRhci5qc1xyXG4gICAgdmFyIHByZXZpb3VzRGF0ZSA9IHRoaXMuY3VycmVudERhdGUoKTtcclxuICAgIHByZXZpb3VzRGF0ZSA9IHByZXZpb3VzRGF0ZSAmJiBwcmV2aW91c0RhdGUudG9JU09TdHJpbmcoKTtcclxuICAgIHRoaXMuY3VycmVudERhdGUuc3Vic2NyaWJlKGZ1bmN0aW9uIChkYXRlKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKCFkYXRlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwb2ludG1lbnRzKFtdKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBJTVBPUlRBTlQ6IFRoZSBkYXRlIG9iamVjdCBtYXkgYmUgcmV1c2VkIGFuZCBtdXRhdGVkIGJldHdlZW4gY2FsbHNcclxuICAgICAgICAvLyAobW9zdGx5IGJlY2F1c2UgdGhlIHdpZGdldCBJIHRoaW5rKSwgc28gaXMgYmV0dGVyIHRvIGNyZWF0ZVxyXG4gICAgICAgIC8vIGEgY2xvbmUgYW5kIGF2b2lkIGdldHRpbmcgcmFjZS1jb25kaXRpb25zIGluIHRoZSBkYXRhIGRvd25sb2FkaW5nLlxyXG4gICAgICAgIGRhdGUgPSBuZXcgRGF0ZShkYXRlLnRvSVNPU3RyaW5nKCkpO1xyXG5cclxuICAgICAgICAvLyBBdm9pZCBkdXBsaWNhdGVkIG5vdGlmaWNhdGlvbiwgdW4tY2hhbmdlZCBkYXRlXHJcbiAgICAgICAgaWYgKGRhdGUudG9JU09TdHJpbmcoKSA9PT0gcHJldmlvdXNEYXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJldmlvdXNEYXRlID0gZGF0ZS50b0lTT1N0cmluZygpO1xyXG5cclxuICAgICAgICB0aGlzLmlzTG9hZGluZyh0cnVlKTtcclxuICAgICAgICBcclxuICAgICAgICBhcHAubW9kZWwuYXBwb2ludG1lbnRzLmdldEFwcG9pbnRtZW50c0J5RGF0ZShkYXRlKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGFwcG9pbnRtZW50c0xpc3QpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIElNUE9SVEFOVDogRmlyc3QsIHdlIG5lZWQgdG8gY2hlY2sgdGhhdCB3ZSBhcmVcclxuICAgICAgICAgICAgLy8gaW4gdGhlIHNhbWUgZGF0ZSBzdGlsbCwgYmVjYXVzZSBzZXZlcmFsIGxvYWRpbmdzXHJcbiAgICAgICAgICAgIC8vIGNhbiBoYXBwZW4gYXQgYSB0aW1lIChjaGFuZ2luZyBxdWlja2x5IGZyb20gZGF0ZSB0byBkYXRlXHJcbiAgICAgICAgICAgIC8vIHdpdGhvdXQgd2FpdCBmb3IgZmluaXNoKSwgYXZvaWRpbmcgYSByYWNlLWNvbmRpdGlvblxyXG4gICAgICAgICAgICAvLyB0aGF0IGNyZWF0ZSBmbGlja2VyaW5nIGVmZmVjdHMgb3IgcmVwbGFjZSB0aGUgZGF0ZSBldmVudHNcclxuICAgICAgICAgICAgLy8gYnkgdGhlIGV2ZW50cyBmcm9tIG90aGVyIGRhdGUsIGJlY2F1c2UgaXQgdG9va3MgbW9yZSBhbiBjaGFuZ2VkLlxyXG4gICAgICAgICAgICAvLyBUT0RPOiBzdGlsbCB0aGlzIGhhcyB0aGUgbWlub3IgYnVnIG9mIGxvc2luZyB0aGUgaXNMb2FkaW5nXHJcbiAgICAgICAgICAgIC8vIGlmIGEgcHJldmlvdXMgdHJpZ2dlcmVkIGxvYWQgc3RpbGwgZGlkbid0IGZpbmlzaGVkOyBpdHMgbWlub3JcclxuICAgICAgICAgICAgLy8gYmVjYXVzZSBpcyB2ZXJ5IHJhcmUgdGhhdCBoYXBwZW5zLCBtb3ZpbmcgdGhpcyBzdHVmZlxyXG4gICAgICAgICAgICAvLyB0byBhIHNwZWNpYWwgYXBwTW9kZWwgZm9yIG1peGVkIGJvb2tpbmdzIGFuZCBldmVudHMgd2l0aCBcclxuICAgICAgICAgICAgLy8gcGVyIGRhdGUgY2FjaGUgdGhhdCBpbmNsdWRlcyBhIHZpZXcgb2JqZWN0IHdpdGggaXNMb2FkaW5nIHdpbGxcclxuICAgICAgICAgICAgLy8gZml4IGl0IGFuZCByZWR1Y2UgdGhpcyBjb21wbGV4aXR5LlxyXG4gICAgICAgICAgICBpZiAoZGF0ZS50b0lTT1N0cmluZygpICE9PSB0aGlzLmN1cnJlbnREYXRlKCkudG9JU09TdHJpbmcoKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gUmFjZSBjb25kaXRpb24sIG5vdCB0aGUgc2FtZSEhIG91dDpcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoYXBwb2ludG1lbnRzTGlzdCAmJiBhcHBvaW50bWVudHNMaXN0Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VyY2U6XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50cyhhcHBvaW50bWVudHNMaXN0KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwb2ludG1lbnRzKFtdKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9LmJpbmQodGhpcykpXHJcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gU2hvdyBmcmVlIG9uIGVycm9yXHJcbiAgICAgICAgICAgIHRoaXMuYXBwb2ludG1lbnRzKFtdKTtcclxuICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIG1zZyA9ICdFcnJvciBsb2FkaW5nIGNhbGVuZGFyIGV2ZW50cy4nO1xyXG4gICAgICAgICAgICBhcHAubW9kYWxzLnNob3dFcnJvcih7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogbXNnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVyciAmJiBlcnIuZXJyb3IgfHwgZXJyXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn1cclxuIiwiLyoqXHJcbiAgICBCb29rTWVCdXR0b24gYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBCb29rTWVCdXR0b25BY3Rpdml0eSgpIHtcclxuICAgIFxyXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIFxyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xyXG5cclxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignU2NoZWR1bGluZycpO1xyXG4gICAgXHJcbiAgICAvLyBBdXRvIHNlbGVjdCB0ZXh0IG9uIHRleHRhcmVhLCBmb3IgYmV0dGVyICdjb3B5J1xyXG4gICAgLy8gTk9URTogdGhlICdzZWxlY3QnIG11c3QgaGFwcGVuIG9uIGNsaWNrLCBub3QgdGFwLCBub3QgZm9jdXMsXHJcbiAgICAvLyBvbmx5ICdjbGljaycgaXMgcmVsaWFibGUgYW5kIGJ1Zy1mcmVlLlxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy4kYWN0aXZpdHksXHJcbiAgICAgICAgZXZlbnQ6ICdjbGljaycsXHJcbiAgICAgICAgc2VsZWN0b3I6ICd0ZXh0YXJlYScsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICQodGhpcykuc2VsZWN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMuYXBwLm1vZGVsLm1hcmtldHBsYWNlUHJvZmlsZSxcclxuICAgICAgICBldmVudDogJ2Vycm9yJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgaWYgKGVyciAmJiBlcnIudGFzayA9PT0gJ3NhdmUnKSByZXR1cm47XHJcbiAgICAgICAgICAgIHZhciBtc2cgPSAnRXJyb3IgbG9hZGluZyBkYXRhIHRvIGJ1aWxkIHRoZSBCdXR0b24uJztcclxuICAgICAgICAgICAgdGhpcy5hcHAubW9kYWxzLnNob3dFcnJvcih7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogbXNnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVyciAmJiBlcnIudGFzayAmJiBlcnIuZXJyb3IgfHwgZXJyXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xyXG4gICAgXHJcbiAgICAvLyBLZWVwIGRhdGEgdXBkYXRlZDpcclxuICAgIHRoaXMuYXBwLm1vZGVsLm1hcmtldHBsYWNlUHJvZmlsZS5zeW5jKCk7XHJcbiAgICBcclxuICAgIC8vIFNldCB0aGUgam9iIHRpdGxlXHJcbiAgICB2YXIgam9iSUQgPSBzdGF0ZS5yb3V0ZS5zZWdtZW50c1swXSB8MDtcclxuICAgIHRoaXMudmlld01vZGVsLmpvYlRpdGxlSUQoam9iSUQpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKGFwcCkge1xyXG5cclxuICAgIHZhciBtYXJrZXRwbGFjZVByb2ZpbGUgPSBhcHAubW9kZWwubWFya2V0cGxhY2VQcm9maWxlO1xyXG4gICAgXHJcbiAgICAvLyBBY3R1YWwgZGF0YSBmb3IgdGhlIGZvcm06XHJcbiAgICBcclxuICAgIC8vIFJlYWQtb25seSBib29rQ29kZVxyXG4gICAgdGhpcy5ib29rQ29kZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBtYXJrZXRwbGFjZVByb2ZpbGUuZGF0YS5ib29rQ29kZSgpO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMuam9iVGl0bGVJRCA9IGtvLm9ic2VydmFibGUoMCk7XHJcbiAgICBcclxuICAgIC8vIEJ1dHRvbiB0eXBlLCBjYW4gYmU6ICdzbWFsbCcsICdtZWRpdW0nLCAnbGFyZ2UnLCAnbGluaydcclxuICAgIHRoaXMudHlwZSA9IGtvLm9ic2VydmFibGUoJ21lZGl1bScpO1xyXG5cclxuICAgIHRoaXMuaXNMb2NrZWQgPSBtYXJrZXRwbGFjZVByb2ZpbGUuaXNMb2NrZWQ7XHJcbiAgICBcclxuICAgIC8vIEdlbmVyYXRpb24gb2YgdGhlIGJ1dHRvbiBjb2RlXHJcbiAgICBcclxuICAgIHZhciBidXR0b25UZW1wbGF0ZSA9XHJcbiAgICAgICAgJzwhLS0gYmVnaW4gTG9jb25vbWljcyBib29rLW1lLWJ1dHRvbiAtLT4nICtcclxuICAgICAgICAnPGEgc3R5bGU9XCJkaXNwbGF5OmlubGluZS1ibG9ja1wiPjxpbWcgYWx0PVwiXCIgc3R5bGU9XCJib3JkZXI6bm9uZVwiIC8+PC9hPicgKyBcclxuICAgICAgICAnPCEtLSBlbmQgTG9jb25vbWljcyBib29rLW1lLWJ1dHRvbiAtLT4nO1xyXG4gICAgXHJcbiAgICB2YXIgbGlua1RlbXBsYXRlID1cclxuICAgICAgICAnPCEtLSBiZWdpbiBMb2Nvbm9taWNzIGJvb2stbWUtYnV0dG9uIC0tPicgK1xyXG4gICAgICAgICc8YT48c3Bhbj48L3NwYW4+PC9hPicgK1xyXG4gICAgICAgICc8IS0tIGVuZCBMb2Nvbm9taWNzIGJvb2stbWUtYnV0dG9uIC0tPic7XHJcblxyXG4gICAgdGhpcy5idXR0b25IdG1sQ29kZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICBpZiAobWFya2V0cGxhY2VQcm9maWxlLmlzTG9hZGluZygpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnbG9hZGluZy4uLic7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgdHlwZSA9IHRoaXMudHlwZSgpLFxyXG4gICAgICAgICAgICAgICAgdHBsID0gYnV0dG9uVGVtcGxhdGU7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gJ2xpbmsnKVxyXG4gICAgICAgICAgICAgICAgdHBsID0gbGlua1RlbXBsYXRlO1xyXG5cclxuICAgICAgICAgICAgdmFyIHNpdGVVcmwgPSAkKCdodG1sJykuYXR0cignZGF0YS1zaXRlLXVybCcpLFxyXG4gICAgICAgICAgICAgICAgbGlua1VybCA9IHNpdGVVcmwgKyAnL2Jvb2svJyArIHRoaXMuYm9va0NvZGUoKSArICcvJyArIHRoaXMuam9iVGl0bGVJRCgpICsgJy8nLFxyXG4gICAgICAgICAgICAgICAgaW1nVXJsID0gc2l0ZVVybCArICcvaW1nL2V4dGVybi9ib29rLW1lLWJ1dHRvbi0nICsgdHlwZSArICcucG5nJztcclxuXHJcbiAgICAgICAgICAgIHZhciBjb2RlID0gZ2VuZXJhdGVCdXR0b25Db2RlKHtcclxuICAgICAgICAgICAgICAgIHRwbDogdHBsLFxyXG4gICAgICAgICAgICAgICAgbGFiZWw6ICdDbGljayBoZXJlIHRvIGJvb2sgbWUgbm93IChvbiBsb2Nvbm9taWNzLmNvbSknLFxyXG4gICAgICAgICAgICAgICAgbGlua1VybDogbGlua1VybCxcclxuICAgICAgICAgICAgICAgIGltZ1VybDogaW1nVXJsXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGNvZGU7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIC8vIFRPRE8gQ29weSBmZWF0dXJlOyB3aWxsIG5lZWQgYSBuYXRpdmUgcGx1Z2luXHJcbiAgICB0aGlzLmNvcHlDb2RlID0gZnVuY3Rpb24oKSB7IH07XHJcbiAgICBcclxuICAgIHRoaXMuc2VuZEJ5RW1haWwgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBUT0RPIFNlbmQgYnkgZW1haWwsIHdpdGggd2luZG93Lm9wZW4oJ21haWx0bzomYm9keT1jb2RlJyk7XHJcbiAgICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZW5lcmF0ZUJ1dHRvbkNvZGUob3B0aW9ucykge1xyXG5cclxuICAgIHZhciAkYnRuID0gJCgkLnBhcnNlSFRNTCgnPGRpdj4nICsgb3B0aW9ucy50cGwgKyAnPC9kaXY+JykpO1xyXG5cclxuICAgICRidG5cclxuICAgIC5maW5kKCdhJylcclxuICAgIC5hdHRyKCdocmVmJywgb3B0aW9ucy5saW5rVXJsKVxyXG4gICAgLmZpbmQoJ3NwYW4nKVxyXG4gICAgLnRleHQob3B0aW9ucy5sYWJlbCk7XHJcbiAgICAkYnRuXHJcbiAgICAuZmluZCgnaW1nJylcclxuICAgIC5hdHRyKCdzcmMnLCBvcHRpb25zLmltZ1VybClcclxuICAgIC5hdHRyKCdhbHQnLCBvcHRpb25zLmxhYmVsKTtcclxuXHJcbiAgICByZXR1cm4gJGJ0bi5odG1sKCk7XHJcbn1cclxuIiwiLyoqXHJcbiAgICBib29raW5nQ29uZmlybWF0aW9uIGFjdGl2aXR5XHJcbiAgICBcclxuICAgIFRPRE86IFRvIHJlcGxhY2VkIGJ5IGEgbW9kYWxcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbiAgICBcclxudmFyIHNpbmdsZXRvbiA9IG51bGw7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0Q2xpZW50cygkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXHJcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IEJvb2tpbmdDb25maXJtYXRpb25BY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XHJcbiAgICBcclxuICAgIHJldHVybiBzaW5nbGV0b247XHJcbn07XHJcblxyXG5mdW5jdGlvbiBCb29raW5nQ29uZmlybWF0aW9uQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XHJcbiAgICBcclxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xyXG4gICAgdGhpcy5hcHAgPSBhcHA7XHJcblxyXG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcclxuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XHJcbn1cclxuXHJcbkJvb2tpbmdDb25maXJtYXRpb25BY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG5cclxuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuYm9va2luZylcclxuICAgICAgICB0aGlzLmRhdGFWaWV3LmJvb2tpbmcob3B0aW9ucy5ib29raW5nKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcclxuXHJcbiAgICAvLyA6QXBwb2ludG1lbnRcclxuICAgIHRoaXMuYm9va2luZyA9IGtvLm9ic2VydmFibGUobnVsbCk7XHJcbn1cclxuIiwiLyoqIENhbGVuZGFyIGFjdGl2aXR5ICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbiAgICAvL0NhbGVuZGFyU2xvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9DYWxlbmRhclNsb3QnKTtcclxuXHJcbnJlcXVpcmUoJy4uL2NvbXBvbmVudHMvRGF0ZVBpY2tlcicpO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIENhbGVuZGFyQWN0aXZpdHkoKSB7XHJcbiAgICBcclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xyXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKCdDYWxlbmRhcicpO1xyXG5cclxuICAgIC8qIEdldHRpbmcgZWxlbWVudHMgKi9cclxuICAgIHRoaXMuJGRhdGVwaWNrZXIgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjY2FsZW5kYXJEYXRlUGlja2VyJyk7XHJcbiAgICB0aGlzLiRkYWlseVZpZXcgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjY2FsZW5kYXJEYWlseVZpZXcnKTtcclxuICAgIHRoaXMuJGRhdGVIZWFkZXIgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjY2FsZW5kYXJEYXRlSGVhZGVyJyk7XHJcbiAgICB0aGlzLiRkYXRlVGl0bGUgPSB0aGlzLiRkYXRlSGVhZGVyLmNoaWxkcmVuKCcuQ2FsZW5kYXJEYXRlSGVhZGVyLWRhdGUnKTtcclxuICAgIHRoaXMuJGNob29zZU5ldyA9ICQoJyNjYWxlbmRhckNob29zZU5ldycpO1xyXG4gICAgXHJcbiAgICAvKiBJbml0IGNvbXBvbmVudHMgKi9cclxuICAgIHRoaXMuJGRhdGVwaWNrZXIuc2hvdygpLmRhdGVwaWNrZXIoKTtcclxuICAgIFxyXG4gICAgLyogRXZlbnQgaGFuZGxlcnMgKi9cclxuICAgIC8vIENoYW5nZXMgb24gY3VycmVudERhdGVcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLmN1cnJlbnREYXRlLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgICAgICAgICAgLy8gVHJpZ2dlciBhIGxheW91dCB1cGRhdGUsIHJlcXVpcmVkIGJ5IHRoZSBmdWxsLWhlaWdodCBmZWF0dXJlXHJcbiAgICAgICAgICAgICQod2luZG93KS50cmlnZ2VyKCdsYXlvdXRVcGRhdGUnKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChkYXRlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbWRhdGUgPSBtb21lbnQoZGF0ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG1kYXRlLmlzVmFsaWQoKSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgaXNvRGF0ZSA9IG1kYXRlLnRvSVNPU3RyaW5nKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBkYXRlcGlja2VyIHNlbGVjdGVkIGRhdGUgb24gZGF0ZSBjaGFuZ2UgKGZyb20gXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYSBkaWZmZXJlbnQgc291cmNlIHRoYW4gdGhlIGRhdGVwaWNrZXIgaXRzZWxmXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5yZW1vdmVDbGFzcygnaXMtdmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENoYW5nZSBub3QgZnJvbSB0aGUgd2lkZ2V0P1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLiRkYXRlcGlja2VyLmRhdGVwaWNrZXIoJ2dldFZhbHVlJykudG9JU09TdHJpbmcoKSAhPT0gaXNvRGF0ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdzZXRWYWx1ZScsIGRhdGUsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBPbiBjdXJyZW50RGF0ZSBjaGFuZ2VzLCB1cGRhdGUgdGhlIFVSTFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHNhdmUgYSB1c2VmdWwgc3RhdGVcclxuICAgICAgICAgICAgICAgICAgICAvLyBET1VCVDogcHVzaCBvciByZXBsYWNlIHN0YXRlPyAobW9yZSBoaXN0b3J5IGVudHJpZXMgb3IgdGhlIHNhbWU/KVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsICdjYWxlbmRhci8nICsgaXNvRGF0ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIERPTkVcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFNvbWV0aGluZyBmYWlsLCBiYWQgZGF0ZSBvciBub3QgZGF0ZSBhdCBhbGxcclxuICAgICAgICAgICAgLy8gU2V0IHRoZSBjdXJyZW50IFxyXG4gICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5jdXJyZW50RGF0ZShnZXREYXRlV2l0aG91dFRpbWUoKSk7XHJcblxyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU3dpcGUgZGF0ZSBvbiBnZXN0dXJlXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLiRkYWlseVZpZXcsXHJcbiAgICAgICAgZXZlbnQ6ICdzd2lwZWxlZnQgc3dpcGVyaWdodCcsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgZGlyID0gZS50eXBlID09PSAnc3dpcGVsZWZ0JyA/ICduZXh0JyA6ICdwcmV2JztcclxuXHJcbiAgICAgICAgICAgIC8vIEhhY2sgdG8gc29sdmUgdGhlIGZyZWV6eS1zd2lwZSBhbmQgdGFwLWFmdGVyIGJ1ZyBvbiBKUU06XHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ3RvdWNoZW5kJyk7XHJcbiAgICAgICAgICAgIC8vIENoYW5nZSBkYXRlXHJcbiAgICAgICAgICAgIHRoaXMuJGRhdGVwaWNrZXIuZGF0ZXBpY2tlcignbW92ZVZhbHVlJywgZGlyLCAnZGF0ZScpO1xyXG5cclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENoYW5naW5nIGRhdGUgd2l0aCBidXR0b25zOlxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy4kZGF0ZUhlYWRlcixcclxuICAgICAgICBldmVudDogJ3RhcCcsXHJcbiAgICAgICAgc2VsZWN0b3I6ICcuQ2FsZW5kYXJEYXRlSGVhZGVyLXN3aXRjaCcsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKGUuY3VycmVudFRhcmdldC5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnI3ByZXYnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJGRhdGVwaWNrZXIuZGF0ZXBpY2tlcignbW92ZVZhbHVlJywgJ3ByZXYnLCAnZGF0ZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnI25leHQnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJGRhdGVwaWNrZXIuZGF0ZXBpY2tlcignbW92ZVZhbHVlJywgJ25leHQnLCAnZGF0ZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAvLyBMZXRzIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFNob3dpbmcgZGF0ZXBpY2tlciB3aGVuIHByZXNzaW5nIHRoZSB0aXRsZVxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy4kZGF0ZVRpdGxlLFxyXG4gICAgICAgIGV2ZW50OiAndGFwJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuJGRhdGVwaWNrZXIudG9nZ2xlQ2xhc3MoJ2lzLXZpc2libGUnKTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gVXBkYXRpbmcgdmlldyBkYXRlIHdoZW4gcGlja2VkIGFub3RoZXIgb25lXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLiRkYXRlcGlja2VyLFxyXG4gICAgICAgIGV2ZW50OiAnY2hhbmdlRGF0ZScsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICBpZiAoZS52aWV3TW9kZSA9PT0gJ2RheXMnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5jdXJyZW50RGF0ZShnZXREYXRlV2l0aG91dFRpbWUoZS5kYXRlKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFNldCBkYXRlIHRvIHRvZGF5XHJcbiAgICB0aGlzLnZpZXdNb2RlbC5jdXJyZW50RGF0ZShnZXREYXRlV2l0aG91dFRpbWUoKSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBvcHRpb25zKTtcclxuXHJcbiAgICAvLyBEYXRlIGZyb20gdGhlIHBhcmFtZXRlciwgZmFsbGJhY2sgdG8gdG9kYXlcclxuICAgIHZhciBzZGF0ZSA9IG9wdGlvbnMucm91dGUgJiYgb3B0aW9ucy5yb3V0ZS5zZWdtZW50cyAmJiBvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdLFxyXG4gICAgICAgIGRhdGU7XHJcbiAgICBpZiAoc2RhdGUpIHtcclxuICAgICAgICAvLyBQYXJzaW5nIGRhdGUgZnJvbSBJU08gZm9ybWF0XHJcbiAgICAgICAgdmFyIG1kYXRlID0gbW9tZW50KHNkYXRlKTtcclxuICAgICAgICAvLyBDaGVjayBpcyB2YWxpZCwgYW5kIGVuc3VyZSBpcyBkYXRlIGF0IDEyQU1cclxuICAgICAgICBkYXRlID0gbWRhdGUuaXNWYWxpZCgpID8gZ2V0RGF0ZVdpdGhvdXRUaW1lKG1kYXRlLnRvRGF0ZSgpKSA6IG51bGw7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGlmICghZGF0ZSlcclxuICAgICAgICAvLyBUb2RheTpcclxuICAgICAgICBkYXRlID0gZ2V0RGF0ZVdpdGhvdXRUaW1lKCk7XHJcbiAgICBcclxuICAgIHRoaXMudmlld01vZGVsLmN1cnJlbnREYXRlKGRhdGUpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gZ2V0RGF0ZVdpdGhvdXRUaW1lKGRhdGUpIHtcclxuICAgIGRhdGUgPSBkYXRlIHx8IG5ldyBEYXRlKCk7XHJcbiAgICByZXR1cm4gbmV3IERhdGUoXHJcbiAgICAgICAgZGF0ZS5nZXRGdWxsWWVhcigpLFxyXG4gICAgICAgIGRhdGUuZ2V0TW9udGgoKSxcclxuICAgICAgICBkYXRlLmdldERhdGUoKSxcclxuICAgICAgICAwLCAwLCAwXHJcbiAgICApO1xyXG59XHJcblxyXG52YXIgQXBwb2ludG1lbnQgPSByZXF1aXJlKCcuLi9tb2RlbHMvQXBwb2ludG1lbnQnKSxcclxuICAgIFRpbWVTbG90Vmlld01vZGVsID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9UaW1lU2xvdCcpO1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKGFwcCkge1xyXG5cclxuICAgIHRoaXMuY3VycmVudERhdGUgPSBrby5vYnNlcnZhYmxlKGdldERhdGVXaXRob3V0VGltZSgpKTtcclxuICAgIHZhciBmdWxsRGF5RnJlZSA9IFtBcHBvaW50bWVudC5uZXdGcmVlU2xvdCh7IGRhdGU6IHRoaXMuY3VycmVudERhdGUoKSB9KV07XHJcblxyXG4gICAgLy8gc2xvdHNTb3VyY2Ugc2F2ZSB0aGUgZGF0YSBhcyBwcm9jZXNzZWQgYnkgYSByZXF1ZXN0IG9mIFxyXG4gICAgLy8gZGF0YSBiZWNhdXNlIGEgZGF0ZSBjaGFuZ2UuXHJcbiAgICAvLyBJdCdzIHVwZGF0ZWQgYnkgY2hhbmdlcyBvbiBjdXJyZW50RGF0ZSB0aGF0IHBlcmZvcm1zIHRoZSByZW1vdGUgbG9hZGluZ1xyXG4gICAgdGhpcy5zbG90c1NvdXJjZSA9IGtvLm9ic2VydmFibGUoZnVsbERheUZyZWUpO1xyXG4gICAgLy8gc2xvdHMgY29tcHV0ZWQsIHVzaW5nIHNsb3RzU291cmNlLlxyXG4gICAgLy8gQXMgY29tcHV0ZWQgaW4gb3JkZXIgdG8gYWxsb3cgYW55IG90aGVyIG9ic2VydmFibGUgY2hhbmdlXHJcbiAgICAvLyBmcm9tIHRyaWdnZXIgdGhlIGNyZWF0aW9uIG9mIGEgbmV3IHZhbHVlXHJcbiAgICB0aGlzLnNsb3RzID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICBcclxuICAgICAgICB2YXIgc2xvdHMgPSB0aGlzLnNsb3RzU291cmNlKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGFwcC5tb2RlbC5hcHBvaW50bWVudHNcclxuICAgICAgICAgICAgLmZpbGxXaXRoRnJlZVNsb3RzKHNsb3RzKVxyXG4gICAgICAgICAgICAubWFwKFRpbWVTbG90Vmlld01vZGVsLmZyb21BcHBvaW50bWVudCk7XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuaXNMb2FkaW5nID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcblxyXG4gICAgLy8gVXBkYXRlIGN1cnJlbnQgc2xvdHMgb24gZGF0ZSBjaGFuZ2VcclxuICAgIHZhciBwcmV2aW91c0RhdGUgPSB0aGlzLmN1cnJlbnREYXRlKCkudG9JU09TdHJpbmcoKTtcclxuICAgIHRoaXMuY3VycmVudERhdGUuc3Vic2NyaWJlKGZ1bmN0aW9uIChkYXRlKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSU1QT1JUQU5UOiBUaGUgZGF0ZSBvYmplY3QgbWF5IGJlIHJldXNlZCBhbmQgbXV0YXRlZCBiZXR3ZWVuIGNhbGxzXHJcbiAgICAgICAgLy8gKG1vc3RseSBiZWNhdXNlIHRoZSB3aWRnZXQgSSB0aGluayksIHNvIGlzIGJldHRlciB0byBjcmVhdGVcclxuICAgICAgICAvLyBhIGNsb25lIGFuZCBhdm9pZCBnZXR0aW5nIHJhY2UtY29uZGl0aW9ucyBpbiB0aGUgZGF0YSBkb3dubG9hZGluZy5cclxuICAgICAgICBkYXRlID0gbmV3IERhdGUoRGF0ZS5wYXJzZShkYXRlLnRvSVNPU3RyaW5nKCkpKTtcclxuXHJcbiAgICAgICAgLy8gQXZvaWQgZHVwbGljYXRlZCBub3RpZmljYXRpb24sIHVuLWNoYW5nZWQgZGF0ZVxyXG4gICAgICAgIGlmIChkYXRlLnRvSVNPU3RyaW5nKCkgPT09IHByZXZpb3VzRGF0ZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByZXZpb3VzRGF0ZSA9IGRhdGUudG9JU09TdHJpbmcoKTtcclxuXHJcbiAgICAgICAgdGhpcy5pc0xvYWRpbmcodHJ1ZSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwLm1vZGVsLmFwcG9pbnRtZW50cy5nZXRBcHBvaW50bWVudHNCeURhdGUoZGF0ZSlcclxuICAgICAgICAudGhlbihmdW5jdGlvbihhcHBvaW50bWVudHNMaXN0KSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBJTVBPUlRBTlQ6IEZpcnN0LCB3ZSBuZWVkIHRvIGNoZWNrIHRoYXQgd2UgYXJlXHJcbiAgICAgICAgICAgIC8vIGluIHRoZSBzYW1lIGRhdGUgc3RpbGwsIGJlY2F1c2Ugc2V2ZXJhbCBsb2FkaW5nc1xyXG4gICAgICAgICAgICAvLyBjYW4gaGFwcGVuIGF0IGEgdGltZSAoY2hhbmdpbmcgcXVpY2tseSBmcm9tIGRhdGUgdG8gZGF0ZVxyXG4gICAgICAgICAgICAvLyB3aXRob3V0IHdhaXQgZm9yIGZpbmlzaCksIGF2b2lkaW5nIGEgcmFjZS1jb25kaXRpb25cclxuICAgICAgICAgICAgLy8gdGhhdCBjcmVhdGUgZmxpY2tlcmluZyBlZmZlY3RzIG9yIHJlcGxhY2UgdGhlIGRhdGUgZXZlbnRzXHJcbiAgICAgICAgICAgIC8vIGJ5IHRoZSBldmVudHMgZnJvbSBvdGhlciBkYXRlLCBiZWNhdXNlIGl0IHRvb2tzIG1vcmUgYW4gY2hhbmdlZC5cclxuICAgICAgICAgICAgLy8gVE9ETzogc3RpbGwgdGhpcyBoYXMgdGhlIG1pbm9yIGJ1ZyBvZiBsb3NpbmcgdGhlIGlzTG9hZGluZ1xyXG4gICAgICAgICAgICAvLyBpZiBhIHByZXZpb3VzIHRyaWdnZXJlZCBsb2FkIHN0aWxsIGRpZG4ndCBmaW5pc2hlZDsgaXRzIG1pbm9yXHJcbiAgICAgICAgICAgIC8vIGJlY2F1c2UgaXMgdmVyeSByYXJlIHRoYXQgaGFwcGVucywgbW92aW5nIHRoaXMgc3R1ZmZcclxuICAgICAgICAgICAgLy8gdG8gYSBzcGVjaWFsIGFwcE1vZGVsIGZvciBtaXhlZCBib29raW5ncyBhbmQgZXZlbnRzIHdpdGggXHJcbiAgICAgICAgICAgIC8vIHBlciBkYXRlIGNhY2hlIHRoYXQgaW5jbHVkZXMgYSB2aWV3IG9iamVjdCB3aXRoIGlzTG9hZGluZyB3aWxsXHJcbiAgICAgICAgICAgIC8vIGZpeCBpdCBhbmQgcmVkdWNlIHRoaXMgY29tcGxleGl0eS5cclxuICAgICAgICAgICAgaWYgKGRhdGUudG9JU09TdHJpbmcoKSAhPT0gdGhpcy5jdXJyZW50RGF0ZSgpLnRvSVNPU3RyaW5nKCkpIHtcclxuICAgICAgICAgICAgICAgIC8vIFJhY2UgY29uZGl0aW9uLCBub3QgdGhlIHNhbWUhISBvdXQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGFwcG9pbnRtZW50c0xpc3QgJiYgYXBwb2ludG1lbnRzTGlzdC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc291cmNlOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zbG90c1NvdXJjZShhcHBvaW50bWVudHNMaXN0KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2xvdHNTb3VyY2UoZnVsbERheUZyZWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0uYmluZCh0aGlzKSlcclxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBTaG93IGZyZWUgb24gZXJyb3JcclxuICAgICAgICAgICAgdGhpcy5zbG90c1NvdXJjZShmdWxsRGF5RnJlZSk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKGZhbHNlKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBtc2cgPSAnRXJyb3IgbG9hZGluZyBjYWxlbmRhciBldmVudHMuJztcclxuICAgICAgICAgICAgYXBwLm1vZGFscy5zaG93RXJyb3Ioe1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IG1zZyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnIgJiYgZXJyLmVycm9yIHx8IGVyclxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59XHJcbiIsIi8qKlxyXG4gICAgQ2FsZW5kYXJTeW5jaW5nIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5JyksXHJcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcblxyXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQ2FsZW5kYXJTeW5jaW5nQWN0aXZpdHkoKSB7XHJcbiAgICBcclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICBcclxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuRnJlZWxhbmNlcjtcclxuXHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ1NjaGVkdWxpbmcnKTtcclxuICAgIFxyXG4gICAgLy8gQWRkaW5nIGF1dG8tc2VsZWN0IGJlaGF2aW9yIHRvIHRoZSBleHBvcnQgVVJMXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLiRhY3Rpdml0eS5maW5kKCcjY2FsZW5kYXJTeW5jLWljYWxFeHBvcnRVcmwnKSxcclxuICAgICAgICBldmVudDogJ2NsaWNrJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgJCh0aGlzKS5zZWxlY3QoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy5hcHAubW9kZWwuY2FsZW5kYXJTeW5jaW5nLFxyXG4gICAgICAgIGV2ZW50OiAnZXJyb3InLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICB2YXIgbXNnID0gZXJyLnRhc2sgPT09ICdzYXZlJyA/ICdFcnJvciBzYXZpbmcgY2FsZW5kYXIgc3luY2luZyBzZXR0aW5ncy4nIDogJ0Vycm9yIGxvYWRpbmcgY2FsZW5kYXIgc3luY2luZyBzZXR0aW5ncy4nO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5tb2RhbHMuc2hvd0Vycm9yKHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBtc2csXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyICYmIGVyci50YXNrICYmIGVyci5lcnJvciB8fCBlcnJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhzdGF0ZSkge1xyXG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBzdGF0ZSk7XHJcbiAgICBcclxuICAgIC8vIEtlZXAgZGF0YSB1cGRhdGVkOlxyXG4gICAgdGhpcy5hcHAubW9kZWwuY2FsZW5kYXJTeW5jaW5nLnN5bmMoKTtcclxuICAgIC8vIERpc2NhcmQgYW55IHByZXZpb3VzIHVuc2F2ZWQgZWRpdFxyXG4gICAgdGhpcy52aWV3TW9kZWwuZGlzY2FyZCgpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKGFwcCkge1xyXG5cclxuICAgIHZhciBjYWxlbmRhclN5bmNpbmcgPSBhcHAubW9kZWwuY2FsZW5kYXJTeW5jaW5nO1xyXG5cclxuICAgIHZhciBzeW5jVmVyc2lvbiA9IGNhbGVuZGFyU3luY2luZy5uZXdWZXJzaW9uKCk7XHJcbiAgICBzeW5jVmVyc2lvbi5pc09ic29sZXRlLnN1YnNjcmliZShmdW5jdGlvbihpdElzKSB7XHJcbiAgICAgICAgaWYgKGl0SXMpIHtcclxuICAgICAgICAgICAgLy8gbmV3IHZlcnNpb24gZnJvbSBzZXJ2ZXIgd2hpbGUgZWRpdGluZ1xyXG4gICAgICAgICAgICAvLyBGVVRVUkU6IHdhcm4gYWJvdXQgYSBuZXcgcmVtb3RlIHZlcnNpb24gYXNraW5nXHJcbiAgICAgICAgICAgIC8vIGNvbmZpcm1hdGlvbiB0byBsb2FkIHRoZW0gb3IgZGlzY2FyZCBhbmQgb3ZlcndyaXRlIHRoZW07XHJcbiAgICAgICAgICAgIC8vIHRoZSBzYW1lIGlzIG5lZWQgb24gc2F2ZSgpLCBhbmQgb24gc2VydmVyIHJlc3BvbnNlXHJcbiAgICAgICAgICAgIC8vIHdpdGggYSA1MDk6Q29uZmxpY3Qgc3RhdHVzIChpdHMgYm9keSBtdXN0IGNvbnRhaW4gdGhlXHJcbiAgICAgICAgICAgIC8vIHNlcnZlciB2ZXJzaW9uKS5cclxuICAgICAgICAgICAgLy8gUmlnaHQgbm93LCBqdXN0IG92ZXJ3cml0ZSBjdXJyZW50IGNoYW5nZXMgd2l0aFxyXG4gICAgICAgICAgICAvLyByZW1vdGUgb25lczpcclxuICAgICAgICAgICAgc3luY1ZlcnNpb24ucHVsbCh7IGV2ZW5JZk5ld2VyOiB0cnVlIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBBY3R1YWwgZGF0YSBmb3IgdGhlIGZvcm06XHJcbiAgICB0aGlzLnN5bmMgPSBzeW5jVmVyc2lvbi52ZXJzaW9uO1xyXG5cclxuICAgIHRoaXMuaXNMb2NrZWQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNMb2NrZWQoKSB8fCB0aGlzLmlzUmVzZXRpbmcoKTtcclxuICAgIH0sIGNhbGVuZGFyU3luY2luZyk7XHJcblxyXG4gICAgdGhpcy5zdWJtaXRUZXh0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKCkgPyBcclxuICAgICAgICAgICAgICAgICdsb2FkaW5nLi4uJyA6IFxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc1NhdmluZygpID8gXHJcbiAgICAgICAgICAgICAgICAgICAgJ3NhdmluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgICAgICAnU2F2ZSdcclxuICAgICAgICApO1xyXG4gICAgfSwgY2FsZW5kYXJTeW5jaW5nKTtcclxuICAgIFxyXG4gICAgdGhpcy5yZXNldFRleHQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5pc1Jlc2V0aW5nKCkgPyBcclxuICAgICAgICAgICAgICAgICdyZXNldGluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgICdSZXNldCBQcml2YXRlIFVSTCdcclxuICAgICAgICApO1xyXG4gICAgfSwgY2FsZW5kYXJTeW5jaW5nKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNjYXJkID0gZnVuY3Rpb24gZGlzY2FyZCgpIHtcclxuICAgICAgICBzeW5jVmVyc2lvbi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICAgICAgLy8gRm9yY2UgdG8gc2F2ZSwgZXZlbiBpZiB0aGVyZSB3YXMgcmVtb3RlIHVwZGF0ZXNcclxuICAgICAgICBzeW5jVmVyc2lvbi5wdXNoKHsgZXZlbklmT2Jzb2xldGU6IHRydWUgfSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLnJlc2V0ID0gZnVuY3Rpb24gcmVzZXQoKSB7XHJcbiAgICAgICAgY2FsZW5kYXJTeW5jaW5nLnJlc2V0RXhwb3J0VXJsKCk7XHJcbiAgICB9O1xyXG59XHJcbiIsIi8qKlxuICAgIENsaWVudEVkaXRpb24gYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBDbGllbnRFZGl0aW9uQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ2NsaWVudHMnKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG52YXIgQ2xpZW50ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0NsaWVudCcpO1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgXG4gICAgdGhpcy5jbGllbnQgPSBrby5vYnNlcnZhYmxlKG5ldyBDbGllbnQoKSk7XG4gICAgXG4gICAgdGhpcy5oZWFkZXIgPSBrby5vYnNlcnZhYmxlKCdFZGl0IExvY2F0aW9uJyk7XG4gICAgXG4gICAgLy8gVE9ET1xuICAgIHRoaXMuc2F2ZSA9IGZ1bmN0aW9uKCkge307XG4gICAgdGhpcy5jYW5jZWwgPSBmdW5jdGlvbigpIHt9O1xufVxuIiwiLyoqXHJcbiAgICBjbGllbnRzIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XHJcblxyXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQ2xpZW50c0FjdGl2aXR5KCkge1xyXG4gICAgXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTsgICAgXHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ0NsaWVudHMnKTtcclxuICAgIFxyXG4gICAgLy8gR2V0dGluZyBlbGVtZW50c1xyXG4gICAgdGhpcy4kaW5kZXggPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjY2xpZW50c0luZGV4Jyk7XHJcbiAgICB0aGlzLiRsaXN0VmlldyA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNjbGllbnRzTGlzdFZpZXcnKTtcclxuICAgIFxyXG4gICAgLy8gVGVzdGluZ0RhdGFcclxuICAgIHRoaXMudmlld01vZGVsLmNsaWVudHMocmVxdWlyZSgnLi4vdGVzdGRhdGEvY2xpZW50cycpLmNsaWVudHMpO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyIHRvIHVwZGF0ZSBoZWFkZXIgYmFzZWQgb24gYSBtb2RlIGNoYW5nZTpcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLmlzU2VsZWN0aW9uTW9kZSxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbiAoaXRJcykge1xyXG4gICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5oZWFkZXJUZXh0KGl0SXMgPyAnU2VsZWN0IGEgY2xpZW50JyA6ICcnKTtcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEhhbmRsZXIgdG8gZ28gYmFjayB3aXRoIHRoZSBzZWxlY3RlZCBjbGllbnQgd2hlbiBcclxuICAgIC8vIHRoZXJlIGlzIG9uZSBzZWxlY3RlZCBhbmQgcmVxdWVzdERhdGEgaXMgZm9yXHJcbiAgICAvLyAnc2VsZWN0IG1vZGUnXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZENsaWVudCxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbiAodGhlU2VsZWN0ZWRDbGllbnQpIHtcclxuICAgICAgICAgICAgLy8gV2UgaGF2ZSBhIHJlcXVlc3QgYW5kXHJcbiAgICAgICAgICAgIC8vIGl0IHJlcXVlc3RlZCB0byBzZWxlY3QgYSBjbGllbnQsXHJcbiAgICAgICAgICAgIC8vIGFuZCBhIHNlbGVjdGVkIGNsaWVudFxyXG4gICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0RGF0YSAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RGF0YS5zZWxlY3RDbGllbnQgPT09IHRydWUgJiZcclxuICAgICAgICAgICAgICAgIHRoZVNlbGVjdGVkQ2xpZW50KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUGFzcyB0aGUgc2VsZWN0ZWQgY2xpZW50IGluIHRoZSBpbmZvXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3REYXRhLnNlbGVjdGVkQ2xpZW50ID0gdGhlU2VsZWN0ZWRDbGllbnQ7XHJcbiAgICAgICAgICAgICAgICAvLyBBbmQgZ28gYmFja1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ29CYWNrKHRoaXMucmVxdWVzdERhdGEpO1xyXG4gICAgICAgICAgICAgICAgLy8gTGFzdCwgY2xlYXIgcmVxdWVzdERhdGFcclxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdERhdGEgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gVE9ETzogY2hlY2sgZXJyb3JzIGZyb20gbG9hZGluZywgd2lsbCBiZSBSZW1vdGVNb2RlbD8/XHJcbiAgICAvKnRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMuYXBwLm1vZGVsLmNsaWVudHMsXHJcbiAgICAgICAgZXZlbnQ6ICdlcnJvcicsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgIGlmIChlcnIudGFzayA9PT0gJ3NhdmUnKSByZXR1cm47XHJcbiAgICAgICAgICAgIHZhciBtc2cgPSAnRXJyb3IgbG9hZGluZyBjbGllbnRzLic7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLm1vZGFscy5zaG93RXJyb3Ioe1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IG1zZyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnIgJiYgZXJyLnRhc2sgJiYgZXJyLmVycm9yIHx8IGVyclxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pOyovXHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xyXG4gICAgXHJcbiAgICAvLyBPbiBldmVyeSBzaG93LCBzZWFyY2ggZ2V0cyByZXNldGVkXHJcbiAgICB0aGlzLnZpZXdNb2RlbC5zZWFyY2hUZXh0KCcnKTtcclxuICAgIFxyXG4gICAgLy8gU2V0IHNlbGVjdGlvbjpcclxuICAgIHRoaXMudmlld01vZGVsLmlzU2VsZWN0aW9uTW9kZShzdGF0ZS5zZWxlY3RDbGllbnQgPT09IHRydWUpO1xyXG4gICAgXHJcbiAgICAvLyBLZWVwIGRhdGEgdXBkYXRlZDpcclxuICAgIC8vIFRPRE86IGFzIFJlbW90ZU1vZGVsP1xyXG4gICAgLy90aGlzLmFwcC5tb2RlbC5jbGllbnRzLnN5bmMoKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcclxuXHJcbiAgICB0aGlzLmhlYWRlclRleHQgPSBrby5vYnNlcnZhYmxlKCcnKTtcclxuXHJcbiAgICAvLyBFc3BlY2lhbCBtb2RlIHdoZW4gaW5zdGVhZCBvZiBwaWNrIGFuZCBlZGl0IHdlIGFyZSBqdXN0IHNlbGVjdGluZ1xyXG4gICAgLy8gKHdoZW4gZWRpdGluZyBhbiBhcHBvaW50bWVudClcclxuICAgIHRoaXMuaXNTZWxlY3Rpb25Nb2RlID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcblxyXG4gICAgLy8gRnVsbCBsaXN0IG9mIGNsaWVudHNcclxuICAgIHRoaXMuY2xpZW50cyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcbiAgICBcclxuICAgIC8vIFNlYXJjaCB0ZXh0LCB1c2VkIHRvIGZpbHRlciAnY2xpZW50cydcclxuICAgIHRoaXMuc2VhcmNoVGV4dCA9IGtvLm9ic2VydmFibGUoJycpO1xyXG4gICAgXHJcbiAgICAvLyBVdGlsaXR5IHRvIGdldCBhIGZpbHRlcmVkIGxpc3Qgb2YgY2xpZW50cyBiYXNlZCBvbiBjbGllbnRzXHJcbiAgICB0aGlzLmdldEZpbHRlcmVkTGlzdCA9IGZ1bmN0aW9uIGdldEZpbHRlcmVkTGlzdCgpIHtcclxuICAgICAgICB2YXIgcyA9ICh0aGlzLnNlYXJjaFRleHQoKSB8fCAnJykudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50cygpLmZpbHRlcihmdW5jdGlvbihjbGllbnQpIHtcclxuICAgICAgICAgICAgdmFyIG4gPSBjbGllbnQgJiYgY2xpZW50LmZ1bGxOYW1lKCkgfHwgJyc7XHJcbiAgICAgICAgICAgIG4gPSBuLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIHJldHVybiBuLmluZGV4T2YocykgPiAtMTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gRmlsdGVyZWQgbGlzdCBvZiBjbGllbnRzXHJcbiAgICB0aGlzLmZpbHRlcmVkQ2xpZW50cyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldEZpbHRlcmVkTGlzdCgpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIC8vIEdyb3VwZWQgbGlzdCBvZiBmaWx0ZXJlZCBjbGllbnRzXHJcbiAgICB0aGlzLmdyb3VwZWRDbGllbnRzID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgdmFyIGNsaWVudHMgPSB0aGlzLmZpbHRlcmVkQ2xpZW50cygpLnNvcnQoZnVuY3Rpb24oY2xpZW50QSwgY2xpZW50Qikge1xyXG4gICAgICAgICAgICByZXR1cm4gY2xpZW50QS5maXJzdE5hbWUoKSA+IGNsaWVudEIuZmlyc3ROYW1lKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGdyb3VwcyA9IFtdLFxyXG4gICAgICAgICAgICBsYXRlc3RHcm91cCA9IG51bGwsXHJcbiAgICAgICAgICAgIGxhdGVzdExldHRlciA9IG51bGw7XHJcblxyXG4gICAgICAgIGNsaWVudHMuZm9yRWFjaChmdW5jdGlvbihjbGllbnQpIHtcclxuICAgICAgICAgICAgdmFyIGxldHRlciA9IChjbGllbnQuZmlyc3ROYW1lKClbMF0gfHwgJycpLnRvVXBwZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIGlmIChsZXR0ZXIgIT09IGxhdGVzdExldHRlcikge1xyXG4gICAgICAgICAgICAgICAgbGF0ZXN0R3JvdXAgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0dGVyOiBsZXR0ZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgY2xpZW50czogW2NsaWVudF1cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBncm91cHMucHVzaChsYXRlc3RHcm91cCk7XHJcbiAgICAgICAgICAgICAgICBsYXRlc3RMZXR0ZXIgPSBsZXR0ZXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsYXRlc3RHcm91cC5jbGllbnRzLnB1c2goY2xpZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gZ3JvdXBzO1xyXG5cclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlbGVjdGVkQ2xpZW50ID0ga28ub2JzZXJ2YWJsZShudWxsKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZWxlY3RDbGllbnQgPSBmdW5jdGlvbihzZWxlY3RlZENsaWVudCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRDbGllbnQoc2VsZWN0ZWRDbGllbnQpO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG59XHJcbiIsIi8qKlxuICAgIENNUyBhY3Rpdml0eVxuICAgIChDbGllbnQgTWFuYWdlbWVudCBTeXN0ZW0pXG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIENtc0FjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKCdDbGllbnQgbWFuYWdlbWVudCcpO1xuICAgIFxuICAgIC8vIEtlZXAgY2xpZW50c0NvdW50IHVwZGF0ZWRcbiAgICAvLyBUT0RPIHRoaXMuYXBwLm1vZGVsLmNsaWVudHNcbiAgICB2YXIgY2xpZW50cyA9IGtvLm9ic2VydmFibGVBcnJheShyZXF1aXJlKCcuLi90ZXN0ZGF0YS9jbGllbnRzJykuY2xpZW50cyk7XG4gICAgdGhpcy52aWV3TW9kZWwuY2xpZW50c0NvdW50KGNsaWVudHMoKS5sZW5ndGgpO1xuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcbiAgICAgICAgdGFyZ2V0OiBjbGllbnRzLFxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmNsaWVudHNDb3VudChjbGllbnRzKCkubGVuZ3RoKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgfSk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgXG4gICAgdGhpcy5jbGllbnRzQ291bnQgPSBrby5vYnNlcnZhYmxlKCk7XG59XG4iLCIvKipcbiAgICBDb250YWN0Rm9ybSBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIENvbnRhY3RGb3JtQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ1RhbGsgdG8gdXMnKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgXG4gICAgdGhpcy5tZXNzYWdlID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgdGhpcy53YXNTZW50ID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG5cbiAgICB2YXIgdXBkYXRlV2FzU2VudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLndhc1NlbnQoZmFsc2UpO1xuICAgIH0uYmluZCh0aGlzKTtcbiAgICB0aGlzLm1lc3NhZ2Uuc3Vic2NyaWJlKHVwZGF0ZVdhc1NlbnQpO1xuICAgIFxuICAgIHRoaXMuc2VuZCA9IGZ1bmN0aW9uIHNlbmQoKSB7XG4gICAgICAgIC8vIFRPRE86IFNlbmRcbiAgICAgICAgXG4gICAgICAgIC8vIFJlc2V0IGFmdGVyIGJlaW5nIHNlbnRcbiAgICAgICAgdGhpcy5tZXNzYWdlKCcnKTtcbiAgICAgICAgdGhpcy53YXNTZW50KHRydWUpO1xuXG4gICAgfS5iaW5kKHRoaXMpO1xufVxuIiwiLyoqXHJcbiAgICBDb250YWN0SW5mbyBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIENvbnRhY3RJbmZvQWN0aXZpdHkoKSB7XHJcbiAgICBcclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblxyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xyXG4gICAgXHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ093bmVyIGluZm9ybWF0aW9uJyk7XHJcbiAgICBcclxuICAgIC8vIFVwZGF0ZSBuYXZCYXIgZm9yIG9uYm9hcmRpbmcgbW9kZSB3aGVuIHRoZSBvbmJvYXJkaW5nU3RlcFxyXG4gICAgLy8gaW4gdGhlIGN1cnJlbnQgbW9kZWwgY2hhbmdlczpcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLnByb2ZpbGUub25ib2FyZGluZ1N0ZXAsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24gKHN0ZXApIHtcclxuICAgICAgICAgICAgaWYgKHN0ZXApIHtcclxuICAgICAgICAgICAgICAgIC8vIFRPRE8gU2V0IG5hdmJhciBzdGVwIGluZGV4XHJcbiAgICAgICAgICAgICAgICAvLyBTZXR0aW5nIG5hdmJhciBmb3IgT25ib2FyZGluZy93aXphcmQgbW9kZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5uYXZCYXIubGVmdEFjdGlvbigpLnRleHQoJycpO1xyXG4gICAgICAgICAgICAgICAgLy8gU2V0dGluZyBoZWFkZXJcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmhlYWRlclRleHQoJ0hvdyBjYW4gd2UgcmVhY2ggeW91PycpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuYnV0dG9uVGV4dCgnU2F2ZSBhbmQgY29udGludWUnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIFRPRE8gUmVtb3ZlIHN0ZXAgaW5kZXhcclxuICAgICAgICAgICAgICAgIC8vIFNldHRpbmcgbmF2YmFyIHRvIGRlZmF1bHRcclxuICAgICAgICAgICAgICAgIHRoaXMubmF2QmFyLmxlZnRBY3Rpb24oKS50ZXh0KCdBY2NvdW50Jyk7XHJcbiAgICAgICAgICAgICAgICAvLyBTZXR0aW5nIGhlYWRlciB0byBkZWZhdWx0XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5oZWFkZXJUZXh0KCdDb250YWN0IGluZm9ybWF0aW9uJyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5idXR0b25UZXh0KCdTYXZlJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG4gICAgLy90aGlzLnZpZXdNb2RlbC5wcm9maWxlLm9uYm9hcmRpbmdTdGVwLnN1YnNjcmliZSgpO1xyXG4gICAgXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLmFwcC5tb2RlbC51c2VyUHJvZmlsZSxcclxuICAgICAgICBldmVudDogJ2Vycm9yJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgdmFyIG1zZyA9IGVyci50YXNrID09PSAnc2F2ZScgPyAnRXJyb3Igc2F2aW5nIGNvbnRhY3QgZGF0YS4nIDogJ0Vycm9yIGxvYWRpbmcgY29udGFjdCBkYXRhLic7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLm1vZGFscy5zaG93RXJyb3Ioe1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IG1zZyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnIgJiYgZXJyLnRhc2sgJiYgZXJyLmVycm9yIHx8IGVyclxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLmFwcC5tb2RlbC5ob21lQWRkcmVzcyxcclxuICAgICAgICBldmVudDogJ2Vycm9yJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgdmFyIG1zZyA9IGVyci50YXNrID09PSAnc2F2ZScgPyAnRXJyb3Igc2F2aW5nIGFkZHJlc3MgZGV0YWlscy4nIDogJ0Vycm9yIGxvYWRpbmcgYWRkcmVzcyBkZXRhaWxzLic7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLm1vZGFscy5zaG93RXJyb3Ioe1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IG1zZyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnIgJiYgZXJyLnRhc2sgJiYgZXJyLmVycm9yIHx8IGVyclxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG59KTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcclxuXHJcbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KHN0YXRlKSB7XHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcclxuICAgIFxyXG4gICAgLy8gRGlzY2FyZCBhbnkgcHJldmlvdXMgdW5zYXZlZCBlZGl0XHJcbiAgICB0aGlzLnZpZXdNb2RlbC5kaXNjYXJkKCk7XHJcbiAgICBcclxuICAgIC8vIEtlZXAgZGF0YSB1cGRhdGVkOlxyXG4gICAgdGhpcy5hcHAubW9kZWwudXNlclByb2ZpbGUuc3luYygpO1xyXG4gICAgdGhpcy5hcHAubW9kZWwuaG9tZUFkZHJlc3Muc3luYygpO1xyXG59O1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbChhcHApIHtcclxuXHJcbiAgICB0aGlzLmhlYWRlclRleHQgPSBrby5vYnNlcnZhYmxlKCdDb250YWN0IGluZm9ybWF0aW9uJyk7XHJcbiAgICB0aGlzLmJ1dHRvblRleHQgPSBrby5vYnNlcnZhYmxlKCdTYXZlJyk7XHJcbiAgICBcclxuICAgIC8vIFVzZXIgUHJvZmlsZVxyXG4gICAgdmFyIHVzZXJQcm9maWxlID0gYXBwLm1vZGVsLnVzZXJQcm9maWxlO1xyXG4gICAgdmFyIHByb2ZpbGVWZXJzaW9uID0gdXNlclByb2ZpbGUubmV3VmVyc2lvbigpO1xyXG4gICAgcHJvZmlsZVZlcnNpb24uaXNPYnNvbGV0ZS5zdWJzY3JpYmUoZnVuY3Rpb24oaXRJcykge1xyXG4gICAgICAgIGlmIChpdElzKSB7XHJcbiAgICAgICAgICAgIC8vIG5ldyB2ZXJzaW9uIGZyb20gc2VydmVyIHdoaWxlIGVkaXRpbmdcclxuICAgICAgICAgICAgLy8gRlVUVVJFOiB3YXJuIGFib3V0IGEgbmV3IHJlbW90ZSB2ZXJzaW9uIGFza2luZ1xyXG4gICAgICAgICAgICAvLyBjb25maXJtYXRpb24gdG8gbG9hZCB0aGVtIG9yIGRpc2NhcmQgYW5kIG92ZXJ3cml0ZSB0aGVtO1xyXG4gICAgICAgICAgICAvLyB0aGUgc2FtZSBpcyBuZWVkIG9uIHNhdmUoKSwgYW5kIG9uIHNlcnZlciByZXNwb25zZVxyXG4gICAgICAgICAgICAvLyB3aXRoIGEgNTA5OkNvbmZsaWN0IHN0YXR1cyAoaXRzIGJvZHkgbXVzdCBjb250YWluIHRoZVxyXG4gICAgICAgICAgICAvLyBzZXJ2ZXIgdmVyc2lvbikuXHJcbiAgICAgICAgICAgIC8vIFJpZ2h0IG5vdywganVzdCBvdmVyd3JpdGUgY3VycmVudCBjaGFuZ2VzIHdpdGhcclxuICAgICAgICAgICAgLy8gcmVtb3RlIG9uZXM6XHJcbiAgICAgICAgICAgIHByb2ZpbGVWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gQWN0dWFsIGRhdGEgZm9yIHRoZSBmb3JtOlxyXG4gICAgdGhpcy5wcm9maWxlID0gcHJvZmlsZVZlcnNpb24udmVyc2lvbjtcclxuICAgIFxyXG4gICAgLy8gVE9ETyBsMTBuXHJcbiAgICB0aGlzLm1vbnRocyA9IGtvLm9ic2VydmFibGVBcnJheShbXHJcbiAgICAgICAgeyBpZDogMSwgbmFtZTogJ0phbnVhcnknfSxcclxuICAgICAgICB7IGlkOiAyLCBuYW1lOiAnRmVicnVhcnknfSxcclxuICAgICAgICB7IGlkOiAzLCBuYW1lOiAnTWFyY2gnfSxcclxuICAgICAgICB7IGlkOiA0LCBuYW1lOiAnQXByaWwnfSxcclxuICAgICAgICB7IGlkOiA1LCBuYW1lOiAnTWF5J30sXHJcbiAgICAgICAgeyBpZDogNiwgbmFtZTogJ0p1bmUnfSxcclxuICAgICAgICB7IGlkOiA3LCBuYW1lOiAnSnVseSd9LFxyXG4gICAgICAgIHsgaWQ6IDgsIG5hbWU6ICdBdWd1c3QnfSxcclxuICAgICAgICB7IGlkOiA5LCBuYW1lOiAnU2VwdGVtYmVyJ30sXHJcbiAgICAgICAgeyBpZDogMTAsIG5hbWU6ICdPY3RvYmVyJ30sXHJcbiAgICAgICAgeyBpZDogMTEsIG5hbWU6ICdOb3ZlbWJlcid9LFxyXG4gICAgICAgIHsgaWQ6IDEyLCBuYW1lOiAnRGVjZW1iZXInfVxyXG4gICAgXSk7XHJcbiAgICAvLyBXZSBuZWVkIHRvIHVzZSBhIHNwZWNpYWwgb2JzZXJ2YWJsZSBpbiB0aGUgZm9ybSwgdGhhdCB3aWxsXHJcbiAgICAvLyB1cGRhdGUgdGhlIGJhY2stZW5kIHByb2ZpbGUuYmlydGhNb250aFxyXG4gICAgdGhpcy5zZWxlY3RlZEJpcnRoTW9udGggPSBrby5jb21wdXRlZCh7XHJcbiAgICAgICAgcmVhZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBiaXJ0aE1vbnRoID0gdGhpcy5wcm9maWxlLmJpcnRoTW9udGgoKTtcclxuICAgICAgICAgICAgcmV0dXJuIGJpcnRoTW9udGggPyB0aGlzLm1vbnRocygpW2JpcnRoTW9udGggLSAxXSA6IG51bGw7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB3cml0ZTogZnVuY3Rpb24obW9udGgpIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9maWxlLmJpcnRoTW9udGgobW9udGggJiYgbW9udGguaWQgfHwgbnVsbCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvd25lcjogdGhpc1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMubW9udGhEYXlzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcclxuICAgIGZvciAodmFyIGlkYXkgPSAxOyBpZGF5IDw9IDMxOyBpZGF5KyspIHtcclxuICAgICAgICB0aGlzLm1vbnRoRGF5cy5wdXNoKGlkYXkpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBIb21lIEFkZHJlc3NcclxuICAgIHZhciBob21lQWRkcmVzcyA9IGFwcC5tb2RlbC5ob21lQWRkcmVzcztcclxuICAgIHZhciBob21lQWRkcmVzc1ZlcnNpb24gPSBob21lQWRkcmVzcy5uZXdWZXJzaW9uKCk7XHJcbiAgICBob21lQWRkcmVzc1ZlcnNpb24uaXNPYnNvbGV0ZS5zdWJzY3JpYmUoZnVuY3Rpb24oaXRJcykge1xyXG4gICAgICAgIGlmIChpdElzKSB7XHJcbiAgICAgICAgICAgIC8vIG5ldyB2ZXJzaW9uIGZyb20gc2VydmVyIHdoaWxlIGVkaXRpbmdcclxuICAgICAgICAgICAgLy8gRlVUVVJFOiB3YXJuIGFib3V0IGEgbmV3IHJlbW90ZSB2ZXJzaW9uIGFza2luZ1xyXG4gICAgICAgICAgICAvLyBjb25maXJtYXRpb24gdG8gbG9hZCB0aGVtIG9yIGRpc2NhcmQgYW5kIG92ZXJ3cml0ZSB0aGVtO1xyXG4gICAgICAgICAgICAvLyB0aGUgc2FtZSBpcyBuZWVkIG9uIHNhdmUoKSwgYW5kIG9uIHNlcnZlciByZXNwb25zZVxyXG4gICAgICAgICAgICAvLyB3aXRoIGEgNTA5OkNvbmZsaWN0IHN0YXR1cyAoaXRzIGJvZHkgbXVzdCBjb250YWluIHRoZVxyXG4gICAgICAgICAgICAvLyBzZXJ2ZXIgdmVyc2lvbikuXHJcbiAgICAgICAgICAgIC8vIFJpZ2h0IG5vdywganVzdCBvdmVyd3JpdGUgY3VycmVudCBjaGFuZ2VzIHdpdGhcclxuICAgICAgICAgICAgLy8gcmVtb3RlIG9uZXM6XHJcbiAgICAgICAgICAgIGhvbWVBZGRyZXNzVmVyc2lvbi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEFjdHVhbCBkYXRhIGZvciB0aGUgZm9ybTpcclxuICAgIHRoaXMuYWRkcmVzcyA9IGhvbWVBZGRyZXNzVmVyc2lvbi52ZXJzaW9uO1xyXG5cclxuICAgIC8vIENvbnRyb2wgb2JzZXJ2YWJsZXM6IHNwZWNpYWwgYmVjYXVzZSBtdXN0IGEgbWl4XHJcbiAgICAvLyBvZiB0aGUgYm90aCByZW1vdGUgbW9kZWxzIHVzZWQgaW4gdGhpcyB2aWV3bW9kZWxcclxuICAgIHRoaXMuaXNMb2NrZWQgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdXNlclByb2ZpbGUuaXNMb2NrZWQoKSB8fCBob21lQWRkcmVzcy5pc0xvY2tlZCgpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICB0aGlzLmlzTG9hZGluZyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB1c2VyUHJvZmlsZS5pc0xvYWRpbmcoKSB8fCBob21lQWRkcmVzcy5pc0xvYWRpbmcoKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgdGhpcy5pc1NhdmluZyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB1c2VyUHJvZmlsZS5pc1NhdmluZygpIHx8IGhvbWVBZGRyZXNzLmlzU2F2aW5nKCk7XHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLnN1Ym1pdFRleHQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcoKSA/IFxyXG4gICAgICAgICAgICAgICAgJ2xvYWRpbmcuLi4nIDogXHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzU2F2aW5nKCkgPyBcclxuICAgICAgICAgICAgICAgICAgICAnc2F2aW5nLi4uJyA6IFxyXG4gICAgICAgICAgICAgICAgICAgICdTYXZlJ1xyXG4gICAgICAgICk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgLy8gQWN0aW9uc1xyXG5cclxuICAgIHRoaXMuZGlzY2FyZCA9IGZ1bmN0aW9uIGRpc2NhcmQoKSB7XHJcbiAgICAgICAgcHJvZmlsZVZlcnNpb24ucHVsbCh7IGV2ZW5JZk5ld2VyOiB0cnVlIH0pO1xyXG4gICAgICAgIGhvbWVBZGRyZXNzVmVyc2lvbi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcblxyXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgICAgICAvLyBGb3JjZSB0byBzYXZlLCBldmVuIGlmIHRoZXJlIHdhcyByZW1vdGUgdXBkYXRlc1xyXG4gICAgICAgIHByb2ZpbGVWZXJzaW9uLnB1c2goeyBldmVuSWZPYnNvbGV0ZTogdHJ1ZSB9KTtcclxuICAgICAgICBob21lQWRkcmVzc1ZlcnNpb24ucHVzaCh7IGV2ZW5JZk9ic29sZXRlOiB0cnVlIH0pO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG59XHJcbiIsIi8qKlxuICAgIENvbnZlcnNhdGlvbiBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIENvbnZlcnNhdGlvbkFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdJbmJveCcpO1xuICAgIFxuICAgIC8vIFRlc3RpbmdEYXRhXG4gICAgc2V0U29tZVRlc3RpbmdEYXRhKHRoaXMudmlld01vZGVsKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KHN0YXRlKSB7XG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBzdGF0ZSk7XG4gICAgXG4gICAgaWYgKHN0YXRlICYmIHN0YXRlLnJvdXRlICYmIHN0YXRlLnJvdXRlLnNlZ21lbnRzKSB7XG4gICAgICAgIHRoaXMudmlld01vZGVsLmNvbnZlcnNhdGlvbklEKHBhcnNlSW50KHN0YXRlLnJvdXRlLnNlZ21lbnRzWzBdLCAxMCkgfHwgMCk7XG4gICAgfVxufTtcblxudmFyIE1haWxGb2xkZXIgPSByZXF1aXJlKCcuLi9tb2RlbHMvTWFpbEZvbGRlcicpO1xudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG4gICAgdGhpcy5pbmJveCA9IG5ldyBNYWlsRm9sZGVyKHtcbiAgICAgICAgdG9wTnVtYmVyOiAyMFxuICAgIH0pO1xuICAgIFxuICAgIHRoaXMuY29udmVyc2F0aW9uSUQgPSBrby5vYnNlcnZhYmxlKG51bGwpO1xuICAgIFxuICAgIHRoaXMuY29udmVyc2F0aW9uID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29uSUQgPSB0aGlzLmNvbnZlcnNhdGlvbklEKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmluYm94Lm1lc3NhZ2VzKCkuZmlsdGVyKGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICAgIHJldHVybiB2ICYmIHYuaWQoKSA9PT0gY29uSUQ7XG4gICAgICAgIH0pO1xuICAgIH0sIHRoaXMpO1xuICAgIFxuICAgIHRoaXMuc3ViamVjdCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG0gPSB0aGlzLmNvbnZlcnNhdGlvbigpWzBdO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgbSA/XG4gICAgICAgICAgICBtLnN1YmplY3QoKSA6XG4gICAgICAgICAgICAnQ29udmVyc2F0aW9uIHcvbyBzdWJqZWN0J1xuICAgICAgICApO1xuICAgICAgICBcbiAgICB9LCB0aGlzKTtcbn1cblxuLyoqIFRFU1RJTkcgREFUQSAqKi9cbmZ1bmN0aW9uIHNldFNvbWVUZXN0aW5nRGF0YSh2aWV3TW9kZWwpIHtcbiAgICBcbiAgICB2aWV3TW9kZWwuaW5ib3gubWVzc2FnZXMocmVxdWlyZSgnLi4vdGVzdGRhdGEvbWVzc2FnZXMnKS5tZXNzYWdlcyk7XG59XG4iLCIvKipcclxuICAgIGRhdGV0aW1lUGlja2VyIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xyXG5yZXF1aXJlKCcuLi9jb21wb25lbnRzL0RhdGVQaWNrZXInKTtcclxuXHJcbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcclxuXHJcbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBEYXRldGltZVBpY2tlckFjdGl2aXR5KCkge1xyXG4gICAgXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcclxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignJyk7XHJcbiAgICBcclxuICAgIC8vIEdldHRpbmcgZWxlbWVudHNcclxuICAgIHRoaXMuJGRhdGVQaWNrZXIgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjZGF0ZXRpbWVQaWNrZXJEYXRlUGlja2VyJyk7XHJcbiAgICB0aGlzLiR0aW1lUGlja2VyID0gdGhpcy4kYWN0aXZpdHkuZmluZCgnI2RhdGV0aW1lUGlja2VyVGltZVBpY2tlcicpO1xyXG4gICAgXHJcbiAgICAvKiBJbml0IGNvbXBvbmVudHMgKi9cclxuICAgIHRoaXMuJGRhdGVQaWNrZXIuc2hvdygpLmRhdGVwaWNrZXIoKTtcclxuICAgIFxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy4kZGF0ZVBpY2tlcixcclxuICAgICAgICBldmVudDogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgaWYgKGUudmlld01vZGUgPT09ICdkYXlzJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuc2VsZWN0ZWREYXRlKGUuZGF0ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZERhdGUsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oZGF0ZSkge1xyXG4gICAgICAgICAgICB0aGlzLmJpbmREYXRlRGF0YShkYXRlKTtcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyIHRvIGdvIGJhY2sgd2l0aCB0aGUgc2VsZWN0ZWQgZGF0ZS10aW1lIHdoZW5cclxuICAgIC8vIHRoYXQgc2VsZWN0aW9uIGlzIGRvbmUgKGNvdWxkIGJlIHRvIG51bGwpXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZERhdGV0aW1lLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uIChkYXRldGltZSkge1xyXG4gICAgICAgICAgICAvLyBXZSBoYXZlIGEgcmVxdWVzdFxyXG4gICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0RGF0YSkge1xyXG4gICAgICAgICAgICAgICAgLy8gUGFzcyB0aGUgc2VsZWN0ZWQgZGF0ZXRpbWUgaW4gdGhlIGluZm9cclxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdERhdGEuc2VsZWN0ZWREYXRldGltZSA9IGRhdGV0aW1lO1xyXG4gICAgICAgICAgICAgICAgLy8gQW5kIGdvIGJhY2tcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvQmFjayh0aGlzLnJlcXVlc3REYXRhKTtcclxuICAgICAgICAgICAgICAgIC8vIExhc3QsIGNsZWFyIHJlcXVlc3REYXRhXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3REYXRhID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIFRlc3RpbmdEYXRhXHJcbiAgICB0aGlzLnZpZXdNb2RlbC5zbG90c0RhdGEgPSByZXF1aXJlKCcuLi90ZXN0ZGF0YS90aW1lU2xvdHMnKS50aW1lU2xvdHM7XHJcbiAgICBcclxuICAgIHRoaXMuYmluZERhdGVEYXRhKG5ldyBEYXRlKCkpO1xyXG59KTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcclxuXHJcbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KHN0YXRlKSB7XHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcclxuXHJcbiAgICAvLyBUT0RPOiB0ZXh0IGZyb20gb3V0c2lkZSBvciBkZXBlbmRpbmcgb24gc3RhdGU/XHJcbiAgICB0aGlzLnZpZXdNb2RlbC5oZWFkZXJUZXh0KCdTZWxlY3QgYSBzdGFydCB0aW1lJyk7XHJcbn07XHJcblxyXG5BLnByb3RvdHlwZS5iaW5kRGF0ZURhdGEgPSBmdW5jdGlvbiBiaW5kRGF0ZURhdGEoZGF0ZSkge1xyXG5cclxuICAgIHZhciBzZGF0ZSA9IG1vbWVudChkYXRlKS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcclxuICAgIHZhciBzbG90c0RhdGEgPSB0aGlzLnZpZXdNb2RlbC5zbG90c0RhdGE7XHJcblxyXG4gICAgaWYgKHNsb3RzRGF0YS5oYXNPd25Qcm9wZXJ0eShzZGF0ZSkpIHtcclxuICAgICAgICB0aGlzLnZpZXdNb2RlbC5zbG90cyhzbG90c0RhdGFbc2RhdGVdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy52aWV3TW9kZWwuc2xvdHMoc2xvdHNEYXRhWydkZWZhdWx0J10pO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJ1NlbGVjdCBhIHRpbWUnKTtcclxuICAgIHRoaXMuc2VsZWN0ZWREYXRlID0ga28ub2JzZXJ2YWJsZShuZXcgRGF0ZSgpKTtcclxuICAgIHRoaXMuc2xvdHNEYXRhID0ge307XHJcbiAgICB0aGlzLnNsb3RzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcclxuICAgIHRoaXMuZ3JvdXBlZFNsb3RzID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuICAgICAgICAvKlxyXG4gICAgICAgICAgYmVmb3JlIDEyOjAwcG0gKG5vb24pID0gbW9ybmluZ1xyXG4gICAgICAgICAgYWZ0ZXJub29uOiAxMjowMHBtIHVudGlsIDU6MDBwbVxyXG4gICAgICAgICAgZXZlbmluZzogNTowMHBtIC0gMTE6NTlwbVxyXG4gICAgICAgICovXHJcbiAgICAgICAgLy8gU2luY2Ugc2xvdHMgbXVzdCBiZSBmb3IgdGhlIHNhbWUgZGF0ZSxcclxuICAgICAgICAvLyB0byBkZWZpbmUgdGhlIGdyb3VwcyByYW5nZXMgdXNlIHRoZSBmaXJzdCBkYXRlXHJcbiAgICAgICAgdmFyIGRhdGVQYXJ0ID0gdGhpcy5zbG90cygpICYmIHRoaXMuc2xvdHMoKVswXSB8fCBuZXcgRGF0ZSgpO1xyXG4gICAgICAgIHZhciBncm91cHMgPSBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGdyb3VwOiAnTW9ybmluZycsXHJcbiAgICAgICAgICAgICAgICBzbG90czogW10sXHJcbiAgICAgICAgICAgICAgICBzdGFydHM6IG5ldyBUaW1lKGRhdGVQYXJ0LCAwLCAwKSxcclxuICAgICAgICAgICAgICAgIGVuZHM6IG5ldyBUaW1lKGRhdGVQYXJ0LCAxMiwgMClcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZ3JvdXA6ICdBZnRlcm5vb24nLFxyXG4gICAgICAgICAgICAgICAgc2xvdHM6IFtdLFxyXG4gICAgICAgICAgICAgICAgc3RhcnRzOiBuZXcgVGltZShkYXRlUGFydCwgMTIsIDApLFxyXG4gICAgICAgICAgICAgICAgZW5kczogbmV3IFRpbWUoZGF0ZVBhcnQsIDE3LCAwKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBncm91cDogJ0V2ZW5pbmcnLFxyXG4gICAgICAgICAgICAgICAgc2xvdHM6IFtdLFxyXG4gICAgICAgICAgICAgICAgc3RhcnRzOiBuZXcgVGltZShkYXRlUGFydCwgMTcsIDApLFxyXG4gICAgICAgICAgICAgICAgZW5kczogbmV3IFRpbWUoZGF0ZVBhcnQsIDI0LCAwKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXTtcclxuICAgICAgICB2YXIgc2xvdHMgPSB0aGlzLnNsb3RzKCkuc29ydCgpO1xyXG4gICAgICAgIHNsb3RzLmZvckVhY2goZnVuY3Rpb24oc2xvdCkge1xyXG4gICAgICAgICAgICBncm91cHMuZm9yRWFjaChmdW5jdGlvbihncm91cCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNsb3QgPj0gZ3JvdXAuc3RhcnRzICYmXHJcbiAgICAgICAgICAgICAgICAgICAgc2xvdCA8IGdyb3VwLmVuZHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBncm91cC5zbG90cy5wdXNoKHNsb3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdyb3VwcztcclxuXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZWxlY3RlZERhdGV0aW1lID0ga28ub2JzZXJ2YWJsZShudWxsKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZWxlY3REYXRldGltZSA9IGZ1bmN0aW9uKHNlbGVjdGVkRGF0ZXRpbWUpIHtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnNlbGVjdGVkRGF0ZXRpbWUoc2VsZWN0ZWREYXRldGltZSk7XHJcblxyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG5cclxufVxyXG4iLCIvKipcbiAgICBGYXFzIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gRmFxc0FjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdUYWxrIHRvIHVzJyk7XG4gICAgXG4gICAgLy8gVGVzdGluZ0RhdGFcbiAgICBzZXRTb21lVGVzdGluZ0RhdGEodGhpcy52aWV3TW9kZWwpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbC5zZWFyY2hUZXh0KCcnKTtcbn07XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcblxuICAgIHRoaXMuZmFxcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XG4gICAgdGhpcy5zZWFyY2hUZXh0ID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgXG4gICAgdGhpcy5maWx0ZXJlZEZhcXMgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzID0gdGhpcy5zZWFyY2hUZXh0KCkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmFxcygpLmZpbHRlcihmdW5jdGlvbih2KSB7XG4gICAgICAgICAgICB2YXIgbiA9IHYgJiYgdi50aXRsZSgpIHx8ICcnO1xuICAgICAgICAgICAgbiArPSB2ICYmIHYuZGVzY3JpcHRpb24oKSB8fCAnJztcbiAgICAgICAgICAgIG4gPSBuLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICByZXR1cm4gbi5pbmRleE9mKHMpID4gLTE7XG4gICAgICAgIH0pO1xuICAgIH0sIHRoaXMpO1xufVxuXG52YXIgTW9kZWwgPSByZXF1aXJlKCcuLi9tb2RlbHMvTW9kZWwnKTtcbmZ1bmN0aW9uIEZhcSh2YWx1ZXMpIHtcbiAgICBcbiAgICBNb2RlbCh0aGlzKTtcblxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XG4gICAgICAgIGlkOiAwLFxuICAgICAgICB0aXRsZTogJycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnJ1xuICAgIH0sIHZhbHVlcyk7XG59XG5cbi8qKiBURVNUSU5HIERBVEEgKiovXG5mdW5jdGlvbiBzZXRTb21lVGVzdGluZ0RhdGEodmlld01vZGVsKSB7XG4gICAgXG4gICAgdmFyIHRlc3RkYXRhID0gW1xuICAgICAgICBuZXcgRmFxKHtcbiAgICAgICAgICAgIGlkOiAxLFxuICAgICAgICAgICAgdGl0bGU6ICdIb3cgZG8gSSBzZXQgdXAgYSBtYXJrZXRwbGFjZSBwcm9maWxlPycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Rlc2NyaXB0aW9uIGFib3V0IGhvdyBJIHNldCB1cCBhIG1hcmtldHBsYWNlIHByb2ZpbGUnXG4gICAgICAgIH0pLFxuICAgICAgICBuZXcgRmFxKHtcbiAgICAgICAgICAgIGlkOiAyLFxuICAgICAgICAgICAgdGl0bGU6ICdBbm90aGVyIGZhcScsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Fub3RoZXIgZGVzY3JpcHRpb24nXG4gICAgICAgIH0pXG4gICAgXTtcbiAgICB2aWV3TW9kZWwuZmFxcyh0ZXN0ZGF0YSk7XG59XG4iLCIvKipcbiAgICBGZWVkYmFjayBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEZlZWRiYWNrQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU2VjdGlvbk5hdkJhcignVGFsayB0byB1cycpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcbiIsIi8qKlxuICAgIEZlZWRiYWNrRm9ybSBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEZlZWRiYWNrRm9ybUFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdUYWxrIHRvIHVzJyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuICAgIFxuICAgIHRoaXMubWVzc2FnZSA9IGtvLm9ic2VydmFibGUoJycpO1xuICAgIHRoaXMuYmVjb21lQ29sbGFib3JhdG9yID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG4gICAgdGhpcy53YXNTZW50ID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG5cbiAgICB2YXIgdXBkYXRlV2FzU2VudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLndhc1NlbnQoZmFsc2UpO1xuICAgIH0uYmluZCh0aGlzKTtcbiAgICB0aGlzLm1lc3NhZ2Uuc3Vic2NyaWJlKHVwZGF0ZVdhc1NlbnQpO1xuICAgIHRoaXMuYmVjb21lQ29sbGFib3JhdG9yLnN1YnNjcmliZSh1cGRhdGVXYXNTZW50KTtcbiAgICBcbiAgICB0aGlzLnNlbmQgPSBmdW5jdGlvbiBzZW5kKCkge1xuICAgICAgICAvLyBUT0RPOiBTZW5kXG4gICAgICAgIFxuICAgICAgICAvLyBSZXNldCBhZnRlciBiZWluZyBzZW50XG4gICAgICAgIHRoaXMubWVzc2FnZSgnJyk7XG4gICAgICAgIHRoaXMuYmVjb21lQ29sbGFib3JhdG9yKGZhbHNlKTtcbiAgICAgICAgdGhpcy53YXNTZW50KHRydWUpO1xuXG4gICAgfS5iaW5kKHRoaXMpO1xufVxuIiwiLyoqXG4gICAgSG9tZSBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEhvbWVBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcbiAgICAvLyBudWxsIGZvciBsb2dvXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKG51bGwpO1xuICAgIFxuICAgIC8vIEdldHRpbmcgZWxlbWVudHNcbiAgICB0aGlzLiRuZXh0Qm9va2luZyA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNob21lTmV4dEJvb2tpbmcnKTtcbiAgICB0aGlzLiR1cGNvbWluZ0Jvb2tpbmdzID0gdGhpcy4kYWN0aXZpdHkuZmluZCgnI2hvbWVVcGNvbWluZ0Jvb2tpbmdzJyk7XG4gICAgdGhpcy4kaW5ib3ggPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjaG9tZUluYm94Jyk7XG4gICAgdGhpcy4kcGVyZm9ybWFuY2UgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjaG9tZVBlcmZvcm1hbmNlJyk7XG4gICAgdGhpcy4kZ2V0TW9yZSA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNob21lR2V0TW9yZScpO1xuICAgIFxuICAgIC8vIFRlc3RpbmdEYXRhXG4gICAgc2V0U29tZVRlc3RpbmdEYXRhKHRoaXMudmlld01vZGVsKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgIFxuICAgIHZhciB2ID0gdGhpcy52aWV3TW9kZWwsXG4gICAgICAgIGFwcE1vZGVsID0gdGhpcy5hcHAubW9kZWw7XG4gICAgXG4gICAgLy8gVXBkYXRlIGRhdGFcbiAgICBhcHBNb2RlbC5ib29raW5ncy5nZXRVcGNvbWluZ0Jvb2tpbmdzKCkudGhlbihmdW5jdGlvbih1cGNvbWluZykge1xuXG4gICAgICAgIGlmICh1cGNvbWluZy5uZXh0Qm9va2luZ0lEKSB7XG4gICAgICAgICAgICB2YXIgcHJldmlvdXNJRCA9IHYubmV4dEJvb2tpbmcoKSAmJiB2Lm5leHRCb29raW5nKCkuc291cmNlQm9va2luZygpLmJvb2tpbmdJRCgpO1xuICAgICAgICAgICAgaWYgKHVwY29taW5nLm5leHRCb29raW5nSUQgIT09IHByZXZpb3VzSUQpIHtcbiAgICAgICAgICAgICAgICB2LmlzTG9hZGluZ05leHRCb29raW5nKHRydWUpO1xuICAgICAgICAgICAgICAgIGFwcE1vZGVsLmFwcG9pbnRtZW50cy5nZXRBcHBvaW50bWVudCh7IGJvb2tpbmdJRDogdXBjb21pbmcubmV4dEJvb2tpbmdJRCB9KVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGFwdCkge1xuICAgICAgICAgICAgICAgICAgICB2Lm5leHRCb29raW5nKGFwdCk7XG4gICAgICAgICAgICAgICAgICAgIHYuaXNMb2FkaW5nTmV4dEJvb2tpbmcoZmFsc2UpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2LmlzTG9hZGluZ05leHRCb29raW5nKGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHYubmV4dEJvb2tpbmcobnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICB2LnVwY29taW5nQm9va2luZ3MudG9kYXkucXVhbnRpdHkodXBjb21pbmcudG9kYXkucXVhbnRpdHkpO1xuICAgICAgICB2LnVwY29taW5nQm9va2luZ3MudG9kYXkudGltZSh1cGNvbWluZy50b2RheS50aW1lICYmIG5ldyBEYXRlKHVwY29taW5nLnRvZGF5LnRpbWUpKTtcbiAgICAgICAgdi51cGNvbWluZ0Jvb2tpbmdzLnRvbW9ycm93LnF1YW50aXR5KHVwY29taW5nLnRvbW9ycm93LnF1YW50aXR5KTtcbiAgICAgICAgdi51cGNvbWluZ0Jvb2tpbmdzLnRvbW9ycm93LnRpbWUodXBjb21pbmcudG9tb3Jyb3cudGltZSAmJiBuZXcgRGF0ZSh1cGNvbWluZy50b21vcnJvdy50aW1lKSk7XG4gICAgICAgIHYudXBjb21pbmdCb29raW5ncy5uZXh0V2Vlay5xdWFudGl0eSh1cGNvbWluZy5uZXh0V2Vlay5xdWFudGl0eSk7XG4gICAgICAgIHYudXBjb21pbmdCb29raW5ncy5uZXh0V2Vlay50aW1lKHVwY29taW5nLm5leHRXZWVrLnRpbWUgJiYgbmV3IERhdGUodXBjb21pbmcubmV4dFdlZWsudGltZSkpO1xuICAgIH0pO1xufTtcblxuXG52YXIgVXBjb21pbmdCb29raW5nc1N1bW1hcnkgPSByZXF1aXJlKCcuLi9tb2RlbHMvVXBjb21pbmdCb29raW5nc1N1bW1hcnknKSxcbiAgICBNYWlsRm9sZGVyID0gcmVxdWlyZSgnLi4vbW9kZWxzL01haWxGb2xkZXInKSxcbiAgICBQZXJmb3JtYW5jZVN1bW1hcnkgPSByZXF1aXJlKCcuLi9tb2RlbHMvUGVyZm9ybWFuY2VTdW1tYXJ5JyksXG4gICAgR2V0TW9yZSA9IHJlcXVpcmUoJy4uL21vZGVscy9HZXRNb3JlJyk7XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcblxuICAgIHRoaXMudXBjb21pbmdCb29raW5ncyA9IG5ldyBVcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeSgpO1xuXG4gICAgLy8gOkFwcG9pbnRtZW50XG4gICAgdGhpcy5uZXh0Qm9va2luZyA9IGtvLm9ic2VydmFibGUobnVsbCk7XG4gICAgdGhpcy5pc0xvYWRpbmdOZXh0Qm9va2luZyA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xuICAgIFxuICAgIHRoaXMuaW5ib3ggPSBuZXcgTWFpbEZvbGRlcih7XG4gICAgICAgIHRvcE51bWJlcjogNFxuICAgIH0pO1xuICAgIFxuICAgIHRoaXMucGVyZm9ybWFuY2UgPSBuZXcgUGVyZm9ybWFuY2VTdW1tYXJ5KCk7XG4gICAgXG4gICAgdGhpcy5nZXRNb3JlID0gbmV3IEdldE1vcmUoKTtcbn1cblxuLyoqIFRFU1RJTkcgREFUQSAqKi9cbmZ1bmN0aW9uIHNldFNvbWVUZXN0aW5nRGF0YSh2aWV3TW9kZWwpIHtcbiAgICBcbiAgICB2aWV3TW9kZWwuaW5ib3gubWVzc2FnZXMocmVxdWlyZSgnLi4vdGVzdGRhdGEvbWVzc2FnZXMnKS5tZXNzYWdlcyk7XG4gICAgXG4gICAgdmlld01vZGVsLnBlcmZvcm1hbmNlLmVhcm5pbmdzLmN1cnJlbnRBbW91bnQoMjQwMCk7XG4gICAgdmlld01vZGVsLnBlcmZvcm1hbmNlLmVhcm5pbmdzLm5leHRBbW91bnQoNjIwMC41NCk7XG4gICAgdmlld01vZGVsLnBlcmZvcm1hbmNlLnRpbWVCb29rZWQucGVyY2VudCgwLjkzKTtcbiAgICBcbiAgICB2aWV3TW9kZWwuZ2V0TW9yZS5tb2RlbC51cGRhdGVXaXRoKHtcbiAgICAgICAgYXZhaWxhYmlsaXR5OiB0cnVlLFxuICAgICAgICBwYXltZW50czogdHJ1ZSxcbiAgICAgICAgcHJvZmlsZTogdHJ1ZSxcbiAgICAgICAgY29vcDogdHJ1ZVxuICAgIH0pO1xufVxuIiwiLyoqXG4gICAgSW5ib3ggYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gSW5ib3hBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIFxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCgpO1xuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU2VjdGlvbk5hdkJhcignSW5ib3gnKTtcbiAgICBcbiAgICAvL3RoaXMuJGluYm94ID0gJGFjdGl2aXR5LmZpbmQoJyNpbmJveExpc3QnKTtcbiAgICBcbiAgICAvLyBUZXN0aW5nRGF0YVxuICAgIHNldFNvbWVUZXN0aW5nRGF0YSh0aGlzLnZpZXdNb2RlbCk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG52YXIgTWFpbEZvbGRlciA9IHJlcXVpcmUoJy4uL21vZGVscy9NYWlsRm9sZGVyJyk7XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcblxuICAgIHRoaXMuaW5ib3ggPSBuZXcgTWFpbEZvbGRlcih7XG4gICAgICAgIHRvcE51bWJlcjogMjBcbiAgICB9KTtcbiAgICBcbiAgICB0aGlzLnNlYXJjaFRleHQgPSBrby5vYnNlcnZhYmxlKCcnKTtcbn1cblxuLyoqIFRFU1RJTkcgREFUQSAqKi9cbmZ1bmN0aW9uIHNldFNvbWVUZXN0aW5nRGF0YShkYXRhVmlldykge1xuICAgIFxuICAgIGRhdGFWaWV3LmluYm94Lm1lc3NhZ2VzKHJlcXVpcmUoJy4uL3Rlc3RkYXRhL21lc3NhZ2VzJykubWVzc2FnZXMpO1xufVxuIiwiLyoqXG4gICAgSW5kZXggYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBJbmRleEFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAvLyBBbnkgdXNlciBjYW4gYWNjZXNzIHRoaXNcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gbnVsbDtcbiAgICBcbiAgICAvLyBudWxsIGZvciBsb2dvXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKG51bGwpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcbiAgICBcbiAgICAvLyBJdCBjaGVja3MgaWYgdGhlIHVzZXIgaXMgbG9nZ2VkIHNvIHRoZW4gXG4gICAgLy8gdGhlaXIgJ2xvZ2dlZCBpbmRleCcgaXMgdGhlIGRhc2hib2FyZCBub3QgdGhpc1xuICAgIC8vIHBhZ2UgdGhhdCBpcyBmb2N1c2VkIG9uIGFub255bW91cyB1c2Vyc1xuICAgIGlmICghdGhpcy5hcHAubW9kZWwudXNlcigpLmlzQW5vbnltb3VzKCkpIHtcbiAgICAgICAgdGhpcy5hcHAuZ29EYXNoYm9hcmQoKTtcbiAgICB9XG59O1xuIiwiLyoqXG4gICAgSm9idGl0bGVzIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpLFxuICAgIFVzZXJKb2JQcm9maWxlVmlld01vZGVsID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9Vc2VySm9iUHJvZmlsZScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gSm9idGl0bGVzQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBVc2VySm9iUHJvZmlsZVZpZXdNb2RlbCh0aGlzLmFwcCk7XG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdTY2hlZHVsaW5nJyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhzdGF0ZSkge1xuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xuXG4gICAgdGhpcy52aWV3TW9kZWwuc3luYygpO1xuXG4gICAgLy8vLyBTZXQgdGhlIGpvYiB0aXRsZVxuICAgIC8vdmFyIGpvYklEID0gc3RhdGUucm91dGUuc2VnbWVudHNbMF0gfDA7XG4gICAgLy90aGlzLnZpZXdNb2RlbC5qb2JUaXRsZUlEKGpvYklEKTtcbn07XG4iLCIvKipcbiAgICBMZWFybk1vcmUgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcbiAgICBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIExlYXJuTW9yZUFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xuICAgIC8vIG51bGwgZm9yIGxvZ29cbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIobnVsbCk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICBcbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnJvdXRlICYmXG4gICAgICAgIG9wdGlvbnMucm91dGUuc2VnbWVudHMgJiZcbiAgICAgICAgb3B0aW9ucy5yb3V0ZS5zZWdtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy52aWV3TW9kZWwucHJvZmlsZShvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdKTtcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgdGhpcy5wcm9maWxlID0ga28ub2JzZXJ2YWJsZSgnY3VzdG9tZXInKTtcbn1cbiIsIi8qKlxuICAgIExvY2F0aW9uRWRpdGlvbiBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxuICAgIExvY2F0aW9uID0gcmVxdWlyZSgnLi4vbW9kZWxzL0xvY2F0aW9uJyksXG4gICAgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBMb2NhdGlvbkVkaXRpb25BY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkZyZWVsYW5jZXI7XG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ0xvY2F0aW9ucycpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuICAgIC8vanNoaW50IG1heGNvbXBsZXhpdHk6MTBcbiAgICBcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgIFxuICAgIHZhciBpZCA9IDAsXG4gICAgICAgIGNyZWF0ZSA9ICcnO1xuXG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMubG9jYXRpb25JRCkge1xuICAgICAgICAgICAgaWQgPSBvcHRpb25zLmxvY2F0aW9uSUQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5yb3V0ZSAmJiBvcHRpb25zLnJvdXRlLnNlZ21lbnRzKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlkID0gcGFyc2VJbnQob3B0aW9ucy5yb3V0ZS5zZWdtZW50c1swXSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5jcmVhdGUpIHtcbiAgICAgICAgICAgIGNyZWF0ZSA9IG9wdGlvbnMuY3JlYXRlO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGlmIChpZCkge1xuICAgICAgICAvLyBUT0RPXG4gICAgICAgIC8vIHZhciBsb2NhdGlvbiA9IHRoaXMuYXBwLm1vZGVsLmdldExvY2F0aW9uKGlkKVxuICAgICAgICAvLyBOT1RFIHRlc3RpbmcgZGF0YVxuICAgICAgICB2YXIgbG9jYXRpb25zID0ge1xuICAgICAgICAgICAgJzEnOiBuZXcgTG9jYXRpb24oe1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uSUQ6IDEsXG4gICAgICAgICAgICAgICAgbmFtZTogJ0hvbWUnLFxuICAgICAgICAgICAgICAgIGFkZHJlc3NMaW5lMTogJ0hlcmUgU3RyZWV0JyxcbiAgICAgICAgICAgICAgICBjaXR5OiAnU2FuIEZyYW5jaXNjbycsXG4gICAgICAgICAgICAgICAgcG9zdGFsQ29kZTogJzkwMDAxJyxcbiAgICAgICAgICAgICAgICBzdGF0ZVByb3ZpbmNlQ29kZTogJ0NBJyxcbiAgICAgICAgICAgICAgICBjb3VudHJ5SUQ6IDEsXG4gICAgICAgICAgICAgICAgaXNTZXJ2aWNlUmFkaXVzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGlzU2VydmljZUxvY2F0aW9uOiBmYWxzZVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAnMic6IG5ldyBMb2NhdGlvbih7XG4gICAgICAgICAgICAgICAgbG9jYXRpb25JRDogMSxcbiAgICAgICAgICAgICAgICBuYW1lOiAnV29ya3Nob3AnLFxuICAgICAgICAgICAgICAgIGFkZHJlc3NMaW5lMTogJ1Vua25vdyBTdHJlZXQnLFxuICAgICAgICAgICAgICAgIGNpdHk6ICdTYW4gRnJhbmNpc2NvJyxcbiAgICAgICAgICAgICAgICBwb3N0YWxDb2RlOiAnOTAwMDEnLFxuICAgICAgICAgICAgICAgIHN0YXRlUHJvdmluY2VDb2RlOiAnQ0EnLFxuICAgICAgICAgICAgICAgIGNvdW50cnlJRDogMSxcbiAgICAgICAgICAgICAgICBpc1NlcnZpY2VSYWRpdXM6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGlzU2VydmljZUxvY2F0aW9uOiB0cnVlXG4gICAgICAgICAgICB9KVxuICAgICAgICB9O1xuICAgICAgICB2YXIgbG9jYXRpb24gPSBsb2NhdGlvbnNbaWRdO1xuICAgICAgICBpZiAobG9jYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmxvY2F0aW9uKGxvY2F0aW9uKTtcblxuICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuaGVhZGVyKCdFZGl0IExvY2F0aW9uJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5sb2NhdGlvbihudWxsKTtcbiAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmhlYWRlcignVW5rbm93IGxvY2F0aW9uIG9yIHdhcyBkZWxldGVkJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIC8vIE5ldyBsb2NhdGlvblxuICAgICAgICB0aGlzLnZpZXdNb2RlbC5sb2NhdGlvbihuZXcgTG9jYXRpb24oKSk7XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggKG9wdGlvbnMuY3JlYXRlKSB7XG4gICAgICAgICAgICBjYXNlICdzZXJ2aWNlUmFkaXVzJzpcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5sb2NhdGlvbigpLmlzU2VydmljZVJhZGl1cyh0cnVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5oZWFkZXIoJ0FkZCBhIHNlcnZpY2UgcmFkaXVzJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdzZXJ2aWNlTG9jYXRpb24nOlxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmxvY2F0aW9uKCkuaXNTZXJ2aWNlTG9jYXRpb24odHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuaGVhZGVyKCdBZGQgYSBzZXJ2aWNlIGxvY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmxvY2F0aW9uKCkuaXNTZXJ2aWNlUmFkaXVzKHRydWUpO1xuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmxvY2F0aW9uKCkuaXNTZXJ2aWNlTG9jYXRpb24odHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuaGVhZGVyKCdBZGQgYSBsb2NhdGlvbicpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuICAgIFxuICAgIHRoaXMubG9jYXRpb24gPSBrby5vYnNlcnZhYmxlKG5ldyBMb2NhdGlvbigpKTtcbiAgICBcbiAgICB0aGlzLmhlYWRlciA9IGtvLm9ic2VydmFibGUoJ0VkaXQgTG9jYXRpb24nKTtcbiAgICBcbiAgICAvLyBUT0RPXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24oKSB7fTtcbiAgICB0aGlzLmNhbmNlbCA9IGZ1bmN0aW9uKCkge307XG59IiwiLyoqXHJcbiAgICBsb2NhdGlvbnMgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcclxuXHJcbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBMb2NhdGlvbnNBY3Rpdml0eSgpIHtcclxuICAgIFxyXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuRnJlZWxhbmNlcjtcclxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ1NjaGVkdWxpbmcnKTtcclxuICAgIFxyXG4gICAgLy8gR2V0dGluZyBlbGVtZW50c1xyXG4gICAgdGhpcy4kbGlzdFZpZXcgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjbG9jYXRpb25zTGlzdFZpZXcnKTtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciB0byB1cGRhdGUgaGVhZGVyIGJhc2VkIG9uIGEgbW9kZSBjaGFuZ2U6XHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdNb2RlbC5pc1NlbGVjdGlvbk1vZGUsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24gKGl0SXMpIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuaGVhZGVyVGV4dChpdElzID8gJ1NlbGVjdCBvciBhZGQgYSBzZXJ2aWNlIGxvY2F0aW9uJyA6ICdMb2NhdGlvbnMnKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFVwZGF0ZSBuYXZiYXIgdG9vXHJcbiAgICAgICAgICAgIC8vIFRPRE86IENhbiBiZSBvdGhlciB0aGFuICdzY2hlZHVsaW5nJywgbGlrZSBtYXJrZXRwbGFjZSBwcm9maWxlIG9yIHRoZSBqb2ItdGl0bGU/XHJcbiAgICAgICAgICAgIHRoaXMubmF2QmFyLmxlZnRBY3Rpb24oKS50ZXh0KGl0SXMgPyAnQm9va2luZycgOiAnU2NoZWR1bGluZycpO1xyXG4gICAgICAgICAgICAvLyBUaXRsZSBtdXN0IGJlIGVtcHR5XHJcbiAgICAgICAgICAgIHRoaXMubmF2QmFyLnRpdGxlKCcnKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFRPRE8gUmVwbGFjZWQgYnkgYSBwcm9ncmVzcyBiYXIgb24gYm9va2luZyBjcmVhdGlvblxyXG4gICAgICAgICAgICAvLyBUT0RPIE9yIGxlZnRBY3Rpb24oKS50ZXh0KC4uKSBvbiBib29raW5nIGVkaXRpb24gKHJldHVybiB0byBib29raW5nKVxyXG4gICAgICAgICAgICAvLyBvciBjb21pbmcgZnJvbSBKb2J0aXRsZS9zY2hlZHVsZSAocmV0dXJuIHRvIHNjaGVkdWxlL2pvYiB0aXRsZSk/XHJcblxyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEhhbmRsZXIgdG8gZ28gYmFjayB3aXRoIHRoZSBzZWxlY3RlZCBsb2NhdGlvbiB3aGVuIFxyXG4gICAgLy8gc2VsZWN0aW9uIG1vZGUgZ29lcyBvZmYgYW5kIHJlcXVlc3RJbmZvIGlzIGZvclxyXG4gICAgLy8gJ3NlbGVjdCBtb2RlJ1xyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwuaXNTZWxlY3Rpb25Nb2RlLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uIChpdElzKSB7XHJcbiAgICAgICAgICAgIC8vIFdlIGhhdmUgYSByZXF1ZXN0IGFuZFxyXG4gICAgICAgICAgICAvLyBpdCByZXF1ZXN0ZWQgdG8gc2VsZWN0IGEgbG9jYXRpb25cclxuICAgICAgICAgICAgLy8gYW5kIHNlbGVjdGlvbiBtb2RlIGdvZXMgb2ZmXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnJlcXVlc3RJbmZvICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvLnNlbGVjdExvY2F0aW9uID09PSB0cnVlICYmXHJcbiAgICAgICAgICAgICAgICBpdElzID09PSBmYWxzZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFBhc3MgdGhlIHNlbGVjdGVkIGNsaWVudCBpbiB0aGUgaW5mb1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mby5zZWxlY3RlZExvY2F0aW9uID0gdGhpcy52aWV3TW9kZWwuc2VsZWN0ZWRMb2NhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgLy8gQW5kIGdvIGJhY2tcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvQmFjayh0aGlzLnJlcXVlc3RJbmZvKTtcclxuICAgICAgICAgICAgICAgIC8vIExhc3QsIGNsZWFyIHJlcXVlc3RJbmZvXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIFRlc3RpbmdEYXRhXHJcbiAgICB0aGlzLnZpZXdNb2RlbC5sb2NhdGlvbnMocmVxdWlyZSgnLi4vdGVzdGRhdGEvbG9jYXRpb25zJykubG9jYXRpb25zKTtcclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgXHJcbiAgICBpZiAob3B0aW9ucy5zZWxlY3RMb2NhdGlvbiA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIHRoaXMudmlld01vZGVsLmlzU2VsZWN0aW9uTW9kZSh0cnVlKTtcclxuICAgICAgICAvLyBwcmVzZXQ6XHJcbiAgICAgICAgdGhpcy52aWV3TW9kZWwuc2VsZWN0ZWRMb2NhdGlvbihvcHRpb25zLnNlbGVjdGVkTG9jYXRpb24pO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAob3B0aW9ucy5yb3V0ZSAmJiBvcHRpb25zLnJvdXRlLnNlZ21lbnRzKSB7XHJcbiAgICAgICAgdmFyIGlkID0gb3B0aW9ucy5yb3V0ZS5zZWdtZW50c1swXTtcclxuICAgICAgICBpZiAoaWQpIHtcclxuICAgICAgICAgICAgaWYgKGlkID09PSAnbmV3Jykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ28oJ2xvY2F0aW9uRWRpdGlvbicsIHtcclxuICAgICAgICAgICAgICAgICAgICBjcmVhdGU6IG9wdGlvbnMucm91dGUuc2VnbWVudHNbMV0gLy8gJ3NlcnZpY2VSYWRpdXMnLCAnc2VydmljZUxvY2F0aW9uJ1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5zaGVsbC5nbygnbG9jYXRpb25FZGl0aW9uJywge1xyXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uSUQ6IGlkXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbChhcHApIHtcclxuXHJcbiAgICB0aGlzLmhlYWRlclRleHQgPSBrby5vYnNlcnZhYmxlKCdMb2NhdGlvbnMnKTtcclxuXHJcbiAgICAvLyBGdWxsIGxpc3Qgb2YgbG9jYXRpb25zXHJcbiAgICB0aGlzLmxvY2F0aW9ucyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcblxyXG4gICAgLy8gRXNwZWNpYWwgbW9kZSB3aGVuIGluc3RlYWQgb2YgcGljayBhbmQgZWRpdCB3ZSBhcmUganVzdCBzZWxlY3RpbmdcclxuICAgIC8vICh3aGVuIGVkaXRpbmcgYW4gYXBwb2ludG1lbnQpXHJcbiAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZSA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG5cclxuICAgIHRoaXMuc2VsZWN0ZWRMb2NhdGlvbiA9IGtvLm9ic2VydmFibGUobnVsbCk7XHJcbiAgICBcclxuICAgIHRoaXMuc2VsZWN0TG9jYXRpb24gPSBmdW5jdGlvbihzZWxlY3RlZExvY2F0aW9uKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHRoaXMuaXNTZWxlY3Rpb25Nb2RlKCkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZExvY2F0aW9uKHNlbGVjdGVkTG9jYXRpb24pO1xyXG4gICAgICAgICAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZShmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBhcHAuc2hlbGwuZ28oJ2xvY2F0aW9uRWRpdGlvbicsIHtcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uSUQ6IHNlbGVjdGVkTG9jYXRpb24ubG9jYXRpb25JRCgpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbn1cclxuIiwiLyoqXG4gICAgTG9naW4gYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxuICAgIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gTG9naW5BY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkFub255bW91cztcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU2VjdGlvbk5hdkJhcignTG9nIGluJyk7XG4gICAgXG4gICAgLy8gUGVyZm9ybSBsb2ctaW4gcmVxdWVzdCB3aGVuIGlzIHJlcXVlc3RlZCBieSB0aGUgZm9ybTpcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwuaXNMb2dpbmdJbixcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24odikge1xuICAgICAgICAgICAgaWYgKHYgPT09IHRydWUpIHtcblxuICAgICAgICAgICAgICAgIC8vIFBlcmZvcm0gbG9naW5nXG5cbiAgICAgICAgICAgICAgICAvLyBOb3RpZnkgc3RhdGU6XG4gICAgICAgICAgICAgICAgdmFyICRidG4gPSB0aGlzLiRhY3Rpdml0eS5maW5kKCdbdHlwZT1cInN1Ym1pdFwiXScpO1xuICAgICAgICAgICAgICAgICRidG4uYnV0dG9uKCdsb2FkaW5nJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBDbGVhciBwcmV2aW91cyBlcnJvciBzbyBtYWtlcyBjbGVhciB3ZVxuICAgICAgICAgICAgICAgIC8vIGFyZSBhdHRlbXB0aW5nXG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwubG9naW5FcnJvcignJyk7XG5cbiAgICAgICAgICAgICAgICB2YXIgZW5kZWQgPSBmdW5jdGlvbiBlbmRlZCgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuaXNMb2dpbmdJbihmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICRidG4uYnV0dG9uKCdyZXNldCcpO1xuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAgICAgICAgIC8vIEFmdGVyIGNsZWFuLXVwIGVycm9yICh0byBmb3JjZSBzb21lIHZpZXcgdXBkYXRlcyksXG4gICAgICAgICAgICAgICAgLy8gdmFsaWRhdGUgYW5kIGFib3J0IG9uIGVycm9yXG4gICAgICAgICAgICAgICAgLy8gTWFudWFsbHkgY2hlY2tpbmcgZXJyb3Igb24gZWFjaCBmaWVsZFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnZpZXdNb2RlbC51c2VybmFtZS5lcnJvcigpIHx8XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnBhc3N3b3JkLmVycm9yKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwubG9naW5FcnJvcignUmV2aWV3IHlvdXIgZGF0YScpO1xuICAgICAgICAgICAgICAgICAgICBlbmRlZCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAubW9kZWwubG9naW4oXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnVzZXJuYW1lKCksXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnBhc3N3b3JkKClcbiAgICAgICAgICAgICAgICApLnRoZW4oZnVuY3Rpb24oLypsb2dpbkRhdGEqLykge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmxvZ2luRXJyb3IoJycpO1xuICAgICAgICAgICAgICAgICAgICBlbmRlZCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBmb3JtIGRhdGFcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwudXNlcm5hbWUoJycpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5wYXNzd29yZCgnJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAuZ29EYXNoYm9hcmQoKTtcblxuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IGVyciAmJiBlcnIucmVzcG9uc2VKU09OICYmIGVyci5yZXNwb25zZUpTT04uZXJyb3JNZXNzYWdlIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnIgJiYgZXJyLnN0YXR1c1RleHQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICdJbnZhbGlkIHVzZXJuYW1lIG9yIHBhc3N3b3JkJztcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5sb2dpbkVycm9yKG1zZyk7XG4gICAgICAgICAgICAgICAgICAgIGVuZGVkKCk7XG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgfSk7XG4gICAgXG4gICAgLy8gRm9jdXMgZmlyc3QgYmFkIGZpZWxkIG9uIGVycm9yXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLmxvZ2luRXJyb3IsXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgLy8gTG9naW4gaXMgZWFzeSBzaW5jZSB3ZSBtYXJrIGJvdGggdW5pcXVlIGZpZWxkc1xuICAgICAgICAgICAgLy8gYXMgZXJyb3Igb24gbG9naW5FcnJvciAoaXRzIGEgZ2VuZXJhbCBmb3JtIGVycm9yKVxuICAgICAgICAgICAgdmFyIGlucHV0ID0gdGhpcy4kYWN0aXZpdHkuZmluZCgnOmlucHV0JykuZ2V0KDApO1xuICAgICAgICAgICAgaWYgKGVycilcbiAgICAgICAgICAgICAgICBpbnB1dC5mb2N1cygpO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlucHV0LmJsdXIoKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgfSk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG52YXIgRm9ybUNyZWRlbnRpYWxzID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9Gb3JtQ3JlZGVudGlhbHMnKTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG4gICAgdmFyIGNyZWRlbnRpYWxzID0gbmV3IEZvcm1DcmVkZW50aWFscygpOyAgICBcbiAgICB0aGlzLnVzZXJuYW1lID0gY3JlZGVudGlhbHMudXNlcm5hbWU7XG4gICAgdGhpcy5wYXNzd29yZCA9IGNyZWRlbnRpYWxzLnBhc3N3b3JkO1xuXG4gICAgdGhpcy5sb2dpbkVycm9yID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgXG4gICAgdGhpcy5pc0xvZ2luZ0luID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG4gICAgXG4gICAgdGhpcy5wZXJmb3JtTG9naW4gPSBmdW5jdGlvbiBwZXJmb3JtTG9naW4oKSB7XG5cbiAgICAgICAgdGhpcy5pc0xvZ2luZ0luKHRydWUpOyAgICAgICAgXG4gICAgfS5iaW5kKHRoaXMpO1xufVxuIiwiLyoqXG4gICAgTG9nb3V0IGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gTG9nb3V0QWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcbiAgICBcbiAgICB0aGlzLmFwcC5tb2RlbC5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBBbm9ueW1vdXMgdXNlciBhZ2FpblxuICAgICAgICB2YXIgbmV3QW5vbiA9IHRoaXMuYXBwLm1vZGVsLnVzZXIoKS5jb25zdHJ1Y3Rvci5uZXdBbm9ueW1vdXMoKTtcbiAgICAgICAgdGhpcy5hcHAubW9kZWwudXNlcigpLm1vZGVsLnVwZGF0ZVdpdGgobmV3QW5vbik7XG5cbiAgICAgICAgLy8gR28gaW5kZXhcbiAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ28oJy8nKTtcbiAgICAgICAgXG4gICAgfS5iaW5kKHRoaXMpKTtcbn07XG4iLCIvKipcbiAgICBPbmJvYXJkaW5nQ29tcGxldGUgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBPbmJvYXJkaW5nQ29tcGxldGVBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKG51bGwpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcbiIsIi8qKlxuICAgIE9uYm9hcmRpbmdIb21lIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gT25ib2FyZGluZ0hvbWVBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgLy8gbnVsbCBmb3IgTG9nb1xuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU2VjdGlvbk5hdkJhcihudWxsKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG4iLCIvKipcbiAgICBPbmJvYXJkaW5nIFBvc2l0aW9ucyBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXG4gICAgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBPbmJvYXJkaW5nUG9zaXRpb25zQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKCdKb2IgVGl0bGVzJyk7XG5cbiAgICAvLyBUZXN0aW5nRGF0YVxuICAgIHNldFNvbWVUZXN0aW5nRGF0YSh0aGlzLnZpZXdNb2RlbCk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG5cbiAgICAvLyBGdWxsIGxpc3Qgb2YgcG9zaXRpb25zXG4gICAgdGhpcy5wb3NpdGlvbnMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xufVxuXG52YXIgUG9zaXRpb24gPSByZXF1aXJlKCcuLi9tb2RlbHMvUG9zaXRpb24nKTtcbi8vIFVzZXJQb3NpdGlvbiBtb2RlbFxuZnVuY3Rpb24gc2V0U29tZVRlc3RpbmdEYXRhKHZpZXdNb2RlbCkge1xuICAgIFxuICAgIHZpZXdNb2RlbC5wb3NpdGlvbnMucHVzaChuZXcgUG9zaXRpb24oe1xuICAgICAgICBwb3NpdGlvblNpbmd1bGFyOiAnTWFzc2FnZSBUaGVyYXBpc3QnXG4gICAgfSkpO1xuICAgIHZpZXdNb2RlbC5wb3NpdGlvbnMucHVzaChuZXcgUG9zaXRpb24oe1xuICAgICAgICBwb3NpdGlvblNpbmd1bGFyOiAnSG91c2VrZWVwZXInXG4gICAgfSkpO1xufSIsIi8qKlxuICAgIE93bmVySW5mbyBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIE93bmVySW5mb0FjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ0FjY291bnQnKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG4iLCIvKipcclxuICAgIFByaXZhY3lTZXR0aW5ncyBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIFByaXZhY3lTZXR0aW5nc0FjdGl2aXR5KCkge1xyXG4gICAgXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XHJcblxyXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdBY2NvdW50Jyk7XHJcbiAgICBcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMuYXBwLm1vZGVsLnByaXZhY3lTZXR0aW5ncyxcclxuICAgICAgICBldmVudDogJ2Vycm9yJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgdmFyIG1zZyA9IGVyci50YXNrID09PSAnc2F2ZScgPyAnRXJyb3Igc2F2aW5nIHByaXZhY3kgc2V0dGluZ3MuJyA6ICdFcnJvciBsb2FkaW5nIHByaXZhY3kgc2V0dGluZ3MuJztcclxuICAgICAgICAgICAgdGhpcy5hcHAubW9kYWxzLnNob3dFcnJvcih7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogbXNnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVyciAmJiBlcnIudGFzayAmJiBlcnIuZXJyb3IgfHwgZXJyXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xyXG4gICAgXHJcbiAgICAgICAgLy8gS2VlcCBkYXRhIHVwZGF0ZWQ6XHJcbiAgICB0aGlzLmFwcC5tb2RlbC5wcml2YWN5U2V0dGluZ3Muc3luYygpO1xyXG4gICAgLy8gRGlzY2FyZCBhbnkgcHJldmlvdXMgdW5zYXZlZCBlZGl0XHJcbiAgICB0aGlzLnZpZXdNb2RlbC5kaXNjYXJkKCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoYXBwKSB7XHJcblxyXG4gICAgdmFyIHByaXZhY3lTZXR0aW5ncyA9IGFwcC5tb2RlbC5wcml2YWN5U2V0dGluZ3M7XHJcblxyXG4gICAgdmFyIHNldHRpbmdzVmVyc2lvbiA9IHByaXZhY3lTZXR0aW5ncy5uZXdWZXJzaW9uKCk7XHJcbiAgICBzZXR0aW5nc1ZlcnNpb24uaXNPYnNvbGV0ZS5zdWJzY3JpYmUoZnVuY3Rpb24oaXRJcykge1xyXG4gICAgICAgIGlmIChpdElzKSB7XHJcbiAgICAgICAgICAgIC8vIG5ldyB2ZXJzaW9uIGZyb20gc2VydmVyIHdoaWxlIGVkaXRpbmdcclxuICAgICAgICAgICAgLy8gRlVUVVJFOiB3YXJuIGFib3V0IGEgbmV3IHJlbW90ZSB2ZXJzaW9uIGFza2luZ1xyXG4gICAgICAgICAgICAvLyBjb25maXJtYXRpb24gdG8gbG9hZCB0aGVtIG9yIGRpc2NhcmQgYW5kIG92ZXJ3cml0ZSB0aGVtO1xyXG4gICAgICAgICAgICAvLyB0aGUgc2FtZSBpcyBuZWVkIG9uIHNhdmUoKSwgYW5kIG9uIHNlcnZlciByZXNwb25zZVxyXG4gICAgICAgICAgICAvLyB3aXRoIGEgNTA5OkNvbmZsaWN0IHN0YXR1cyAoaXRzIGJvZHkgbXVzdCBjb250YWluIHRoZVxyXG4gICAgICAgICAgICAvLyBzZXJ2ZXIgdmVyc2lvbikuXHJcbiAgICAgICAgICAgIC8vIFJpZ2h0IG5vdywganVzdCBvdmVyd3JpdGUgY3VycmVudCBjaGFuZ2VzIHdpdGhcclxuICAgICAgICAgICAgLy8gcmVtb3RlIG9uZXM6XHJcbiAgICAgICAgICAgIHNldHRpbmdzVmVyc2lvbi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEFjdHVhbCBkYXRhIGZvciB0aGUgZm9ybTpcclxuICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5nc1ZlcnNpb24udmVyc2lvbjtcclxuXHJcbiAgICB0aGlzLmlzTG9ja2VkID0gcHJpdmFjeVNldHRpbmdzLmlzTG9ja2VkO1xyXG5cclxuICAgIHRoaXMuc3VibWl0VGV4dCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZygpID8gXHJcbiAgICAgICAgICAgICAgICAnbG9hZGluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNTYXZpbmcoKSA/IFxyXG4gICAgICAgICAgICAgICAgICAgICdzYXZpbmcuLi4nIDogXHJcbiAgICAgICAgICAgICAgICAgICAgJ1NhdmUnXHJcbiAgICAgICAgKTtcclxuICAgIH0sIHByaXZhY3lTZXR0aW5ncyk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzY2FyZCA9IGZ1bmN0aW9uIGRpc2NhcmQoKSB7XHJcbiAgICAgICAgc2V0dGluZ3NWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgICAgIC8vIEZvcmNlIHRvIHNhdmUsIGV2ZW4gaWYgdGhlcmUgd2FzIHJlbW90ZSB1cGRhdGVzXHJcbiAgICAgICAgc2V0dGluZ3NWZXJzaW9uLnB1c2goeyBldmVuSWZPYnNvbGV0ZTogdHJ1ZSB9KTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxufVxyXG4iLCIvKipcbiAgICBTY2hlZHVsaW5nIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpLFxuICAgIFVzZXJKb2JQcm9maWxlVmlld01vZGVsID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9Vc2VySm9iUHJvZmlsZScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gU2NoZWR1bGluZ0FjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBVc2VySm9iUHJvZmlsZVZpZXdNb2RlbCh0aGlzLmFwcCk7XG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKCdTY2hlZHVsaW5nJyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhzdGF0ZSkge1xuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xuXG4gICAgdGhpcy52aWV3TW9kZWwuc3luYygpO1xufTtcbiIsIi8qKlxyXG4gICAgU2NoZWR1bGluZ1ByZWZlcmVuY2VzIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBTY2hlZHVsaW5nUHJlZmVyZW5jZXNBY3Rpdml0eSgpIHtcclxuICAgIFxyXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIFxyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xyXG5cclxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignU2NoZWR1bGluZycpO1xyXG4gICAgXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLmFwcC5tb2RlbC5zY2hlZHVsaW5nUHJlZmVyZW5jZXMsXHJcbiAgICAgICAgZXZlbnQ6ICdlcnJvcicsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgIHZhciBtc2cgPSBlcnIudGFzayA9PT0gJ3NhdmUnID8gJ0Vycm9yIHNhdmluZyBzY2hlZHVsaW5nIHByZWZlcmVuY2VzLicgOiAnRXJyb3IgbG9hZGluZyBzY2hlZHVsaW5nIHByZWZlcmVuY2VzLic7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLm1vZGFscy5zaG93RXJyb3Ioe1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IG1zZyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnIgJiYgZXJyLnRhc2sgJiYgZXJyLmVycm9yIHx8IGVyclxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG59KTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcclxuXHJcbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KHN0YXRlKSB7XHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcclxuICAgIFxyXG4gICAgICAgIC8vIEtlZXAgZGF0YSB1cGRhdGVkOlxyXG4gICAgdGhpcy5hcHAubW9kZWwuc2NoZWR1bGluZ1ByZWZlcmVuY2VzLnN5bmMoKTtcclxuICAgIC8vIERpc2NhcmQgYW55IHByZXZpb3VzIHVuc2F2ZWQgZWRpdFxyXG4gICAgdGhpcy52aWV3TW9kZWwuZGlzY2FyZCgpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKGFwcCkge1xyXG5cclxuICAgIHZhciBzY2hlZHVsaW5nUHJlZmVyZW5jZXMgPSBhcHAubW9kZWwuc2NoZWR1bGluZ1ByZWZlcmVuY2VzO1xyXG5cclxuICAgIHZhciBwcmVmc1ZlcnNpb24gPSBzY2hlZHVsaW5nUHJlZmVyZW5jZXMubmV3VmVyc2lvbigpO1xyXG4gICAgcHJlZnNWZXJzaW9uLmlzT2Jzb2xldGUuc3Vic2NyaWJlKGZ1bmN0aW9uKGl0SXMpIHtcclxuICAgICAgICBpZiAoaXRJcykge1xyXG4gICAgICAgICAgICAvLyBuZXcgdmVyc2lvbiBmcm9tIHNlcnZlciB3aGlsZSBlZGl0aW5nXHJcbiAgICAgICAgICAgIC8vIEZVVFVSRTogd2FybiBhYm91dCBhIG5ldyByZW1vdGUgdmVyc2lvbiBhc2tpbmdcclxuICAgICAgICAgICAgLy8gY29uZmlybWF0aW9uIHRvIGxvYWQgdGhlbSBvciBkaXNjYXJkIGFuZCBvdmVyd3JpdGUgdGhlbTtcclxuICAgICAgICAgICAgLy8gdGhlIHNhbWUgaXMgbmVlZCBvbiBzYXZlKCksIGFuZCBvbiBzZXJ2ZXIgcmVzcG9uc2VcclxuICAgICAgICAgICAgLy8gd2l0aCBhIDUwOTpDb25mbGljdCBzdGF0dXMgKGl0cyBib2R5IG11c3QgY29udGFpbiB0aGVcclxuICAgICAgICAgICAgLy8gc2VydmVyIHZlcnNpb24pLlxyXG4gICAgICAgICAgICAvLyBSaWdodCBub3csIGp1c3Qgb3ZlcndyaXRlIGN1cnJlbnQgY2hhbmdlcyB3aXRoXHJcbiAgICAgICAgICAgIC8vIHJlbW90ZSBvbmVzOlxyXG4gICAgICAgICAgICBwcmVmc1ZlcnNpb24ucHVsbCh7IGV2ZW5JZk5ld2VyOiB0cnVlIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBBY3R1YWwgZGF0YSBmb3IgdGhlIGZvcm06XHJcbiAgICB0aGlzLnByZWZzID0gcHJlZnNWZXJzaW9uLnZlcnNpb247XHJcblxyXG4gICAgdGhpcy5pc0xvY2tlZCA9IHNjaGVkdWxpbmdQcmVmZXJlbmNlcy5pc0xvY2tlZDtcclxuXHJcbiAgICB0aGlzLnN1Ym1pdFRleHQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcoKSA/IFxyXG4gICAgICAgICAgICAgICAgJ2xvYWRpbmcuLi4nIDogXHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzU2F2aW5nKCkgPyBcclxuICAgICAgICAgICAgICAgICAgICAnc2F2aW5nLi4uJyA6IFxyXG4gICAgICAgICAgICAgICAgICAgICdTYXZlJ1xyXG4gICAgICAgICk7XHJcbiAgICB9LCBzY2hlZHVsaW5nUHJlZmVyZW5jZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmRpc2NhcmQgPSBmdW5jdGlvbiBkaXNjYXJkKCkge1xyXG4gICAgICAgIHByZWZzVmVyc2lvbi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcblxyXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgICAgICAvLyBGb3JjZSB0byBzYXZlLCBldmVuIGlmIHRoZXJlIHdhcyByZW1vdGUgdXBkYXRlc1xyXG4gICAgICAgIHByZWZzVmVyc2lvbi5wdXNoKHsgZXZlbklmT2Jzb2xldGU6IHRydWUgfSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuaW5jcmVtZW50c0V4YW1wbGUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHN0ciA9ICdlLmcuICcsXHJcbiAgICAgICAgICAgIGluY1NpemUgPSB0aGlzLmluY3JlbWVudHNTaXplSW5NaW51dGVzKCksXHJcbiAgICAgICAgICAgIG0gPSBtb21lbnQoeyBob3VyOiAxMCwgbWludXRlOiAwIH0pLFxyXG4gICAgICAgICAgICBob3VycyA9IFttLmZvcm1hdCgnSEg6bW0nKV07XHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCA0OyBpKyspIHtcclxuICAgICAgICAgICAgaG91cnMucHVzaChcclxuICAgICAgICAgICAgICAgIG0uYWRkKGluY1NpemUsICdtaW51dGVzJylcclxuICAgICAgICAgICAgICAgIC5mb3JtYXQoJ0hIOm1tJylcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RyICs9IGhvdXJzLmpvaW4oJywgJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHN0cjtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMucHJlZnMpO1xyXG59XHJcbiIsIi8qKlxyXG4gICAgc2VydmljZXMgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxuICAgIFxyXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gU2VydmljZXNBY3Rpdml0eSgpIHtcclxuXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuRnJlbGFuY2VyO1xyXG4gICAgXHJcbiAgICAvLyBUT0RPOiBvbiBzaG93LCBuZWVkIHRvIGJlIHVwZGF0ZWQgd2l0aCB0aGUgSm9iVGl0bGUgbmFtZVxyXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdKb2IgdGl0bGUnKTtcclxuICAgIFxyXG4gICAgLy90aGlzLiRsaXN0VmlldyA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNzZXJ2aWNlc0xpc3RWaWV3Jyk7XHJcblxyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XHJcblxyXG4gICAgLy8gVGVzdGluZ0RhdGFcclxuICAgIHRoaXMudmlld01vZGVsLnNlcnZpY2VzKHJlcXVpcmUoJy4uL3Rlc3RkYXRhL3NlcnZpY2VzJykuc2VydmljZXMubWFwKFNlbGVjdGFibGUpKTtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciB0byBnbyBiYWNrIHdpdGggdGhlIHNlbGVjdGVkIHNlcnZpY2Ugd2hlbiBcclxuICAgIC8vIHNlbGVjdGlvbiBtb2RlIGdvZXMgb2ZmIGFuZCByZXF1ZXN0RGF0YSBpcyBmb3JcclxuICAgIC8vICdzZWxlY3QgbW9kZSdcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLmlzU2VsZWN0aW9uTW9kZSxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbiAoaXRJcykge1xyXG4gICAgICAgICAgICAvLyBXZSBoYXZlIGEgcmVxdWVzdCBhbmRcclxuICAgICAgICAgICAgLy8gaXQgcmVxdWVzdGVkIHRvIHNlbGVjdCBhIHNlcnZpY2VcclxuICAgICAgICAgICAgLy8gYW5kIHNlbGVjdGlvbiBtb2RlIGdvZXMgb2ZmXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnJlcXVlc3REYXRhICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3REYXRhLnNlbGVjdFNlcnZpY2VzID09PSB0cnVlICYmXHJcbiAgICAgICAgICAgICAgICBpdElzID09PSBmYWxzZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFBhc3MgdGhlIHNlbGVjdGVkIGNsaWVudCBpbiB0aGUgaW5mb1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RGF0YS5zZWxlY3RlZFNlcnZpY2VzID0gdGhpcy52aWV3TW9kZWwuc2VsZWN0ZWRTZXJ2aWNlcygpO1xyXG4gICAgICAgICAgICAgICAgLy8gQW5kIGdvIGJhY2tcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvQmFjayh0aGlzLnJlcXVlc3REYXRhKTtcclxuICAgICAgICAgICAgICAgIC8vIExhc3QsIGNsZWFyIHJlcXVlc3REYXRhXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3REYXRhID0ge307XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG59KTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcclxuXHJcbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcclxuXHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgXHJcbiAgICAvLyBHZXQgam9idGl0bGVJRCBmb3IgdGhlIHJlcXVlc3RcclxuICAgIHZhciByb3V0ZSA9IHRoaXMucmVxdWVzdERhdGEgJiYgdGhpcy5yZXF1ZXN0RGF0YS5yb3V0ZTtcclxuICAgIHZhciBqb2JUaXRsZUlEID0gcm91dGUgJiYgcm91dGUuc2VnbWVudHMgJiYgcm91dGUuc2VnbWVudHNbMF07XHJcbiAgICBqb2JUaXRsZUlEID0gcGFyc2VJbnQoam9iVGl0bGVJRCwgMTApO1xyXG4gICAgaWYgKGpvYlRpdGxlSUQpIHtcclxuICAgICAgICAvLyBUT0RPOiBnZXQgZGF0YSBmb3IgdGhlIEpvYiB0aXRsZSBJRFxyXG4gICAgICAgIGNvbnNvbGUubG9nKCdqb2JUaXRsZUlEJywgam9iVGl0bGVJRCk7XHJcbiAgICAgICAgdGhpcy5hcHAubW9kZWwudXNlckpvYlByb2ZpbGUuZ2V0VXNlckpvYlRpdGxlKGpvYlRpdGxlSUQpLnRoZW4oZnVuY3Rpb24odXNlckpvYnRpdGxlKSB7XHJcbiAgICAgICAgICAgIGlmICghdXNlckpvYnRpdGxlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTm8gdXNlciBqb2IgdGl0bGUnKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBGaWxsIGluIGpvYiB0aXRsZSBuYW1lXHJcbiAgICAgICAgICAgIHRoaXMuYXBwLm1vZGVsLmdldEpvYlRpdGxlKGpvYlRpdGxlSUQpLnRoZW4oZnVuY3Rpb24oam9iVGl0bGUpIHtcclxuICAgICAgICAgICAgICAgIGlmICgham9iVGl0bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTm8gam9iIHRpdGxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5uYXZCYXIubGVmdEFjdGlvbigpLnRleHQoam9iVGl0bGUuc2luZ3VsYXJOYW1lKCkpO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVE9ETyBMb2FkIGpvYiB0aXRsZSBwcmljaW5nIG9uIHRoaXMgYWN0aXZpdHk6XHJcbiAgICAgICAgICAgIC8vdGhpcy52aWV3TW9kZWwuc2VydmljZXModXNlckpvYnRpdGxlLnNlcnZpY2VzKCkpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnSm9iIFRpdGxlIFByaWNpbmcvU2VydmljZXMgbG9hZCBub3Qgc3VwcG9ydGVkIHN0aWxsJyk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5yZXF1ZXN0RGF0YS5zZWxlY3RTZXJ2aWNlcyA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIHRoaXMudmlld01vZGVsLmlzU2VsZWN0aW9uTW9kZSh0cnVlKTtcclxuICAgICAgICBcclxuICAgICAgICAvKiBUcmlhbHMgdG8gcHJlc2V0cyB0aGUgc2VsZWN0ZWQgc2VydmljZXMsIE5PVCBXT1JLSU5HXHJcbiAgICAgICAgdmFyIHNlcnZpY2VzID0gKG9wdGlvbnMuc2VsZWN0ZWRTZXJ2aWNlcyB8fCBbXSk7XHJcbiAgICAgICAgdmFyIHNlbGVjdGVkU2VydmljZXMgPSB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZFNlcnZpY2VzO1xyXG4gICAgICAgIHNlbGVjdGVkU2VydmljZXMucmVtb3ZlQWxsKCk7XHJcbiAgICAgICAgdGhpcy52aWV3TW9kZWwuc2VydmljZXMoKS5mb3JFYWNoKGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgc2VydmljZXMuZm9yRWFjaChmdW5jdGlvbihzZWxTZXJ2aWNlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsU2VydmljZSA9PT0gc2VydmljZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlcnZpY2UuaXNTZWxlY3RlZCh0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZFNlcnZpY2VzLnB1c2goc2VydmljZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlcnZpY2UuaXNTZWxlY3RlZChmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICovXHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBTZWxlY3RhYmxlKG9iaikge1xyXG4gICAgb2JqLmlzU2VsZWN0ZWQgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuICAgIHJldHVybiBvYmo7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcclxuXHJcbiAgICAvLyBGdWxsIGxpc3Qgb2Ygc2VydmljZXNcclxuICAgIHRoaXMuc2VydmljZXMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xyXG5cclxuICAgIC8vIEVzcGVjaWFsIG1vZGUgd2hlbiBpbnN0ZWFkIG9mIHBpY2sgYW5kIGVkaXQgd2UgYXJlIGp1c3Qgc2VsZWN0aW5nXHJcbiAgICAvLyAod2hlbiBlZGl0aW5nIGFuIGFwcG9pbnRtZW50KVxyXG4gICAgdGhpcy5pc1NlbGVjdGlvbk1vZGUgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuXHJcbiAgICAvLyBHcm91cGVkIGxpc3Qgb2YgcHJpY2luZ3M6XHJcbiAgICAvLyBEZWZpbmVkIGdyb3VwczogcmVndWxhciBzZXJ2aWNlcyBhbmQgYWRkLW9uc1xyXG4gICAgdGhpcy5ncm91cGVkU2VydmljZXMgPSBrby5jb21wdXRlZChmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICB2YXIgc2VydmljZXMgPSB0aGlzLnNlcnZpY2VzKCk7XHJcbiAgICAgICAgdmFyIGlzU2VsZWN0aW9uID0gdGhpcy5pc1NlbGVjdGlvbk1vZGUoKTtcclxuXHJcbiAgICAgICAgdmFyIHNlcnZpY2VzR3JvdXAgPSB7XHJcbiAgICAgICAgICAgICAgICBncm91cDogaXNTZWxlY3Rpb24gPyAnU2VsZWN0IHN0YW5kYWxvbmUgc2VydmljZXMnIDogJ1N0YW5kYWxvbmUgc2VydmljZXMnLFxyXG4gICAgICAgICAgICAgICAgc2VydmljZXM6IFtdXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGFkZG9uc0dyb3VwID0ge1xyXG4gICAgICAgICAgICAgICAgZ3JvdXA6IGlzU2VsZWN0aW9uID8gJ1NlbGVjdCBhZGQtb24gc2VydmljZXMnIDogJ0FkZC1vbiBzZXJ2aWNlcycsXHJcbiAgICAgICAgICAgICAgICBzZXJ2aWNlczogW11cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZ3JvdXBzID0gW3NlcnZpY2VzR3JvdXAsIGFkZG9uc0dyb3VwXTtcclxuXHJcbiAgICAgICAgc2VydmljZXMuZm9yRWFjaChmdW5jdGlvbihzZXJ2aWNlKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgaXNBZGRvbiA9IHNlcnZpY2UuaXNBZGRvbigpO1xyXG4gICAgICAgICAgICBpZiAoaXNBZGRvbikge1xyXG4gICAgICAgICAgICAgICAgYWRkb25zR3JvdXAuc2VydmljZXMucHVzaChzZXJ2aWNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHNlcnZpY2VzR3JvdXAuc2VydmljZXMucHVzaChzZXJ2aWNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gZ3JvdXBzO1xyXG5cclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlbGVjdGVkU2VydmljZXMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xyXG4gICAgLyoqXHJcbiAgICAgICAgVG9nZ2xlIHRoZSBzZWxlY3Rpb24gc3RhdHVzIG9mIGEgc2VydmljZSwgYWRkaW5nXHJcbiAgICAgICAgb3IgcmVtb3ZpbmcgaXQgZnJvbSB0aGUgJ3NlbGVjdGVkU2VydmljZXMnIGFycmF5LlxyXG4gICAgKiovXHJcbiAgICB0aGlzLnRvZ2dsZVNlcnZpY2VTZWxlY3Rpb24gPSBmdW5jdGlvbihzZXJ2aWNlKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGluSW5kZXggPSAtMSxcclxuICAgICAgICAgICAgaXNTZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWRTZXJ2aWNlcygpLnNvbWUoZnVuY3Rpb24oc2VsZWN0ZWRTZXJ2aWNlLCBpbmRleCkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0ZWRTZXJ2aWNlID09PSBzZXJ2aWNlKSB7XHJcbiAgICAgICAgICAgICAgICBpbkluZGV4ID0gaW5kZXg7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHNlcnZpY2UuaXNTZWxlY3RlZCghaXNTZWxlY3RlZCk7XHJcblxyXG4gICAgICAgIGlmIChpc1NlbGVjdGVkKVxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkU2VydmljZXMuc3BsaWNlKGluSW5kZXgsIDEpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFNlcnZpY2VzLnB1c2goc2VydmljZSk7XHJcblxyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBFbmRzIHRoZSBzZWxlY3Rpb24gcHJvY2VzcywgcmVhZHkgdG8gY29sbGVjdCBzZWxlY3Rpb25cclxuICAgICAgICBhbmQgcGFzc2luZyBpdCB0byB0aGUgcmVxdWVzdCBhY3Rpdml0eVxyXG4gICAgKiovXHJcbiAgICB0aGlzLmVuZFNlbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuaXNTZWxlY3Rpb25Nb2RlKGZhbHNlKTtcclxuICAgICAgICBcclxuICAgIH0uYmluZCh0aGlzKTtcclxufVxyXG4iLCIvKipcbiAgICBTaWdudXAgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxuICAgIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gU2lnbnVwQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Bbm9ueW1vdXM7XG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcbiAgICAvLyBudWxsIGZvciBMb2dvXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKG51bGwpO1xuICAgIFxuICAgIC8vIFBlcmZvcm0gc2lnbi11cCByZXF1ZXN0IHdoZW4gaXMgcmVxdWVzdGVkIGJ5IHRoZSBmb3JtOlxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdNb2RlbC5pc1NpZ25pbmdVcCxcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24odikge1xuICAgICAgICAgICAgaWYgKHYgPT09IHRydWUpIHtcblxuICAgICAgICAgICAgICAgIC8vIFBlcmZvcm0gc2lnbnVwXG5cbiAgICAgICAgICAgICAgICAvLyBOb3RpZnkgc3RhdGU6XG4gICAgICAgICAgICAgICAgdmFyICRidG4gPSB0aGlzLiRhY3Rpdml0eS5maW5kKCdbdHlwZT1cInN1Ym1pdFwiXScpO1xuICAgICAgICAgICAgICAgICRidG4uYnV0dG9uKCdsb2FkaW5nJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBDbGVhciBwcmV2aW91cyBlcnJvciBzbyBtYWtlcyBjbGVhciB3ZVxuICAgICAgICAgICAgICAgIC8vIGFyZSBhdHRlbXB0aW5nXG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuc2lnbnVwRXJyb3IoJycpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGVuZGVkID0gZnVuY3Rpb24gZW5kZWQoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmlzU2lnbmluZ1VwKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgJGJ0bi5idXR0b24oJ3Jlc2V0Jyk7XG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICAgICAgLy8gQWZ0ZXIgY2xlYW4tdXAgZXJyb3IgKHRvIGZvcmNlIHNvbWUgdmlldyB1cGRhdGVzKSxcbiAgICAgICAgICAgICAgICAvLyB2YWxpZGF0ZSBhbmQgYWJvcnQgb24gZXJyb3JcbiAgICAgICAgICAgICAgICAvLyBNYW51YWxseSBjaGVja2luZyBlcnJvciBvbiBlYWNoIGZpZWxkXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudmlld01vZGVsLnVzZXJuYW1lLmVycm9yKCkgfHxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwucGFzc3dvcmQuZXJyb3IoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5zaWdudXBFcnJvcignUmV2aWV3IHlvdXIgZGF0YScpO1xuICAgICAgICAgICAgICAgICAgICBlbmRlZCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAubW9kZWwuc2lnbnVwKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC51c2VybmFtZSgpLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5wYXNzd29yZCgpLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5wcm9maWxlKClcbiAgICAgICAgICAgICAgICApLnRoZW4oZnVuY3Rpb24oLypzaWdudXBEYXRhKi8pIHtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5zaWdudXBFcnJvcignJyk7XG4gICAgICAgICAgICAgICAgICAgIGVuZGVkKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGZvcm0gZGF0YVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC51c2VybmFtZSgnJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnBhc3N3b3JkKCcnKTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcC5nb0Rhc2hib2FyZCgpO1xuXG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKS5jYXRjaChmdW5jdGlvbihlcnIpIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgbXNnID0gZXJyICYmIGVyci5yZXNwb25zZUpTT04gJiYgZXJyLnJlc3BvbnNlSlNPTi5lcnJvck1lc3NhZ2UgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVyciAmJiBlcnIuc3RhdHVzVGV4dCB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0ludmFsaWQgdXNlcm5hbWUgb3IgcGFzc3dvcmQnO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnNpZ251cEVycm9yKG1zZyk7XG4gICAgICAgICAgICAgICAgICAgIGVuZGVkKCk7XG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgfSk7XG4gICAgXG4gICAgLy8gRm9jdXMgZmlyc3QgYmFkIGZpZWxkIG9uIGVycm9yXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLnNpZ251cEVycm9yLFxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgIC8vIFNpZ251cCBpcyBlYXN5IHNpbmNlIHdlIG1hcmsgYm90aCB1bmlxdWUgZmllbGRzXG4gICAgICAgICAgICAvLyBhcyBlcnJvciBvbiBzaWdudXBFcnJvciAoaXRzIGEgZ2VuZXJhbCBmb3JtIGVycm9yKVxuICAgICAgICAgICAgdmFyIGlucHV0ID0gdGhpcy4kYWN0aXZpdHkuZmluZCgnOmlucHV0JykuZ2V0KDApO1xuICAgICAgICAgICAgaWYgKGVycilcbiAgICAgICAgICAgICAgICBpbnB1dC5mb2N1cygpO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlucHV0LmJsdXIoKTtcbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgXG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5yb3V0ZSAmJlxuICAgICAgICBvcHRpb25zLnJvdXRlLnNlZ21lbnRzICYmXG4gICAgICAgIG9wdGlvbnMucm91dGUuc2VnbWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMudmlld01vZGVsLnByb2ZpbGUob3B0aW9ucy5yb3V0ZS5zZWdtZW50c1swXSk7XG4gICAgfVxufTtcblxuXG52YXIgRm9ybUNyZWRlbnRpYWxzID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9Gb3JtQ3JlZGVudGlhbHMnKTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG4gICAgdmFyIGNyZWRlbnRpYWxzID0gbmV3IEZvcm1DcmVkZW50aWFscygpOyAgICBcbiAgICB0aGlzLnVzZXJuYW1lID0gY3JlZGVudGlhbHMudXNlcm5hbWU7XG4gICAgdGhpcy5wYXNzd29yZCA9IGNyZWRlbnRpYWxzLnBhc3N3b3JkO1xuXG4gICAgdGhpcy5zaWdudXBFcnJvciA9IGtvLm9ic2VydmFibGUoJycpO1xuICAgIFxuICAgIHRoaXMuaXNTaWduaW5nVXAgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcbiAgICBcbiAgICB0aGlzLnBlcmZvcm1TaWdudXAgPSBmdW5jdGlvbiBwZXJmb3JtU2lnbnVwKCkge1xuXG4gICAgICAgIHRoaXMuaXNTaWduaW5nVXAodHJ1ZSk7XG4gICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5wcm9maWxlID0ga28ub2JzZXJ2YWJsZSgnY3VzdG9tZXInKTtcbn1cbiIsIi8qKlxyXG4gICAgdGV4dEVkaXRvciBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcixcclxuICAgIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIFRleHRFZGl0b3JBY3Rpdml0eSgpIHtcclxuICAgIFxyXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcclxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XHJcbiAgICAvLyBUaXRsZSBpcyBlbXB0eSBldmVyLCBzaW5jZSB3ZSBhcmUgaW4gJ2dvIGJhY2snIG1vZGUgYWxsIHRoZSB0aW1lIGhlcmVcclxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignJyk7XHJcbiAgICBcclxuICAgIC8vIEdldHRpbmcgZWxlbWVudHNcclxuICAgIHRoaXMuJHRleHRhcmVhID0gdGhpcy4kYWN0aXZpdHkuZmluZCgndGV4dGFyZWEnKTtcclxuICAgIHRoaXMudGV4dGFyZWEgPSB0aGlzLiR0ZXh0YXJlYS5nZXQoMCk7XHJcbiAgICBcclxuICAgIC8vIEhhbmRsZXIgZm9yIHRoZSAnc2F2ZWQnIGV2ZW50IHNvIHRoZSBhY3Rpdml0eVxyXG4gICAgLy8gcmV0dXJucyBiYWNrIHRvIHRoZSByZXF1ZXN0ZXIgYWN0aXZpdHkgZ2l2aW5nIGl0XHJcbiAgICAvLyB0aGUgbmV3IHRleHRcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLFxyXG4gICAgICAgIGV2ZW50OiAnc2F2ZWQnLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0SW5mbykge1xyXG4gICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBpbmZvIHdpdGggdGhlIG5ldyB0ZXh0XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvLnRleHQgPSB0aGlzLnZpZXdNb2RlbC50ZXh0KCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGFuZCBwYXNzIGl0IGJhY2tcclxuICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ29CYWNrKHRoaXMucmVxdWVzdEluZm8pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEhhbmRsZXIgdGhlIGNhbmNlbCBldmVudFxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwsXHJcbiAgICAgICAgZXZlbnQ6ICdjYW5jZWwnLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAvLyByZXR1cm4sIG5vdGhpbmcgY2hhbmdlZFxyXG4gICAgICAgICAgICB0aGlzLmFwcC5zaGVsbC5nb0JhY2soKTtcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG59KTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcclxuXHJcbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgb3B0aW9ucyk7XHJcbiAgICBcclxuICAgIC8vIFNldCBuYXZpZ2F0aW9uIHRpdGxlIG9yIG5vdGhpbmdcclxuICAgIHRoaXMubmF2QmFyLmxlZnRBY3Rpb24oKS50ZXh0KG9wdGlvbnMudGl0bGUgfHwgJycpO1xyXG4gICAgXHJcbiAgICAvLyBGaWVsZCBoZWFkZXJcclxuICAgIHRoaXMudmlld01vZGVsLmhlYWRlclRleHQob3B0aW9ucy5oZWFkZXIpO1xyXG4gICAgdGhpcy52aWV3TW9kZWwudGV4dChvcHRpb25zLnRleHQpO1xyXG4gICAgaWYgKG9wdGlvbnMucm93c051bWJlcilcclxuICAgICAgICB0aGlzLnZpZXdNb2RlbC5yb3dzTnVtYmVyKG9wdGlvbnMucm93c051bWJlcik7XHJcbiAgICAgICAgXHJcbiAgICAvLyBJbm1lZGlhdGUgZm9jdXMgdG8gdGhlIHRleHRhcmVhIGZvciBiZXR0ZXIgdXNhYmlsaXR5XHJcbiAgICB0aGlzLnRleHRhcmVhLmZvY3VzKCk7XHJcbiAgICB0aGlzLiR0ZXh0YXJlYS5jbGljaygpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJ1RleHQnKTtcclxuXHJcbiAgICAvLyBUZXh0IHRvIGVkaXRcclxuICAgIHRoaXMudGV4dCA9IGtvLm9ic2VydmFibGUoJycpO1xyXG4gICAgXHJcbiAgICAvLyBOdW1iZXIgb2Ygcm93cyBmb3IgdGhlIHRleHRhcmVhXHJcbiAgICB0aGlzLnJvd3NOdW1iZXIgPSBrby5vYnNlcnZhYmxlKDIpO1xyXG5cclxuICAgIHRoaXMuY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKCkge1xyXG4gICAgICAgIHRoaXMuZW1pdCgnY2FuY2VsJyk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgICAgIHRoaXMuZW1pdCgnc2F2ZWQnKTtcclxuICAgIH07XHJcbn1cclxuXHJcblZpZXdNb2RlbC5faW5oZXJpdHMoRXZlbnRFbWl0dGVyKTtcclxuIiwiLyoqXHJcbiAgICBXZWVrbHlTY2hlZHVsZSBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIFdlZWtseVNjaGVkdWxlQWN0aXZpdHkoKSB7XHJcbiAgICBcclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICBcclxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuRnJlZWxhbmNlcjtcclxuXHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ1NjaGVkdWxpbmcnKTtcclxuICAgIFxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy5hcHAubW9kZWwuc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlLFxyXG4gICAgICAgIGV2ZW50OiAnZXJyb3InLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICB2YXIgbXNnID0gZXJyLnRhc2sgPT09ICdzYXZlJyA/ICdFcnJvciBzYXZpbmcgeW91ciB3ZWVrbHkgc2NoZWR1bGUuJyA6ICdFcnJvciBsb2FkaW5nIHlvdXIgd2Vla2x5IHNjaGVkdWxlLic7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLm1vZGFscy5zaG93RXJyb3Ioe1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IG1zZyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnIgJiYgZXJyLnRhc2sgJiYgZXJyLmVycm9yIHx8IGVyclxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG59KTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcclxuXHJcbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KHN0YXRlKSB7XHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcclxuICAgIFxyXG4gICAgLy8gS2VlcCBkYXRhIHVwZGF0ZWQ6XHJcbiAgICB0aGlzLmFwcC5tb2RlbC5zaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUuc3luYygpO1xyXG4gICAgLy8gRGlzY2FyZCBhbnkgcHJldmlvdXMgdW5zYXZlZCBlZGl0XHJcbiAgICB0aGlzLnZpZXdNb2RlbC5kaXNjYXJkKCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoYXBwKSB7XHJcblxyXG4gICAgdmFyIHNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSA9IGFwcC5tb2RlbC5zaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGU7XHJcblxyXG4gICAgdmFyIHNjaGVkdWxlVmVyc2lvbiA9IHNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZS5uZXdWZXJzaW9uKCk7XHJcbiAgICBzY2hlZHVsZVZlcnNpb24uaXNPYnNvbGV0ZS5zdWJzY3JpYmUoZnVuY3Rpb24oaXRJcykge1xyXG4gICAgICAgIGlmIChpdElzKSB7XHJcbiAgICAgICAgICAgIC8vIG5ldyB2ZXJzaW9uIGZyb20gc2VydmVyIHdoaWxlIGVkaXRpbmdcclxuICAgICAgICAgICAgLy8gRlVUVVJFOiB3YXJuIGFib3V0IGEgbmV3IHJlbW90ZSB2ZXJzaW9uIGFza2luZ1xyXG4gICAgICAgICAgICAvLyBjb25maXJtYXRpb24gdG8gbG9hZCB0aGVtIG9yIGRpc2NhcmQgYW5kIG92ZXJ3cml0ZSB0aGVtO1xyXG4gICAgICAgICAgICAvLyB0aGUgc2FtZSBpcyBuZWVkIG9uIHNhdmUoKSwgYW5kIG9uIHNlcnZlciByZXNwb25zZVxyXG4gICAgICAgICAgICAvLyB3aXRoIGEgNTA5OkNvbmZsaWN0IHN0YXR1cyAoaXRzIGJvZHkgbXVzdCBjb250YWluIHRoZVxyXG4gICAgICAgICAgICAvLyBzZXJ2ZXIgdmVyc2lvbikuXHJcbiAgICAgICAgICAgIC8vIFJpZ2h0IG5vdywganVzdCBvdmVyd3JpdGUgY3VycmVudCBjaGFuZ2VzIHdpdGhcclxuICAgICAgICAgICAgLy8gcmVtb3RlIG9uZXM6XHJcbiAgICAgICAgICAgIHNjaGVkdWxlVmVyc2lvbi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEFjdHVhbCBkYXRhIGZvciB0aGUgZm9ybTpcclxuICAgIHRoaXMuc2NoZWR1bGUgPSBzY2hlZHVsZVZlcnNpb24udmVyc2lvbjtcclxuXHJcbiAgICB0aGlzLmlzTG9ja2VkID0gc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlLmlzTG9ja2VkO1xyXG5cclxuICAgIHRoaXMuc3VibWl0VGV4dCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZygpID8gXHJcbiAgICAgICAgICAgICAgICAnbG9hZGluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNTYXZpbmcoKSA/IFxyXG4gICAgICAgICAgICAgICAgICAgICdzYXZpbmcuLi4nIDogXHJcbiAgICAgICAgICAgICAgICAgICAgJ1NhdmUnXHJcbiAgICAgICAgKTtcclxuICAgIH0sIHNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzY2FyZCA9IGZ1bmN0aW9uIGRpc2NhcmQoKSB7XHJcbiAgICAgICAgc2NoZWR1bGVWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgICAgICAvLyBGb3JjZSB0byBzYXZlLCBldmVuIGlmIHRoZXJlIHdhcyByZW1vdGUgdXBkYXRlc1xyXG4gICAgICAgIHNjaGVkdWxlVmVyc2lvbi5wdXNoKHsgZXZlbklmT2Jzb2xldGU6IHRydWUgfSk7XHJcbiAgICB9O1xyXG59XHJcbiIsIi8qKlxyXG4gICAgUmVnaXN0cmF0aW9uIG9mIGN1c3RvbSBodG1sIGNvbXBvbmVudHMgdXNlZCBieSB0aGUgQXBwLlxyXG4gICAgQWxsIHdpdGggJ2FwcC0nIGFzIHByZWZpeC5cclxuICAgIFxyXG4gICAgU29tZSBkZWZpbml0aW9ucyBtYXkgYmUgaW5jbHVkZWQgb24tbGluZSByYXRoZXIgdGhhbiBvbiBzZXBhcmF0ZWRcclxuICAgIGZpbGVzICh2aWV3bW9kZWxzKSwgdGVtcGxhdGVzIGFyZSBsaW5rZWQgc28gbmVlZCB0byBiZSBcclxuICAgIGluY2x1ZGVkIGluIHRoZSBodG1sIGZpbGUgd2l0aCB0aGUgc2FtZSBJRCB0aGF0IHJlZmVyZW5jZWQgaGVyZSxcclxuICAgIHVzdWFsbHkgdXNpbmcgYXMgRE9NIElEIHRoZSBzYW1lIG5hbWUgYXMgdGhlIGNvbXBvbmVudCB3aXRoIHN1Zml4ICctdGVtcGxhdGUnLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIHByb3BUb29scyA9IHJlcXVpcmUoJy4vdXRpbHMvanNQcm9wZXJ0aWVzVG9vbHMnKSxcclxuICAgIGdldE9ic2VydmFibGUgPSByZXF1aXJlKCcuL3V0aWxzL2dldE9ic2VydmFibGUnKTtcclxuXHJcbmV4cG9ydHMucmVnaXN0ZXJBbGwgPSBmdW5jdGlvbigpIHtcclxuICAgIFxyXG4gICAgLy8vIG5hdmJhci1hY3Rpb25cclxuICAgIGtvLmNvbXBvbmVudHMucmVnaXN0ZXIoJ2FwcC1uYXZiYXItYWN0aW9uJywge1xyXG4gICAgICAgIHRlbXBsYXRlOiB7IGVsZW1lbnQ6ICduYXZiYXItYWN0aW9uLXRlbXBsYXRlJyB9LFxyXG4gICAgICAgIHZpZXdNb2RlbDogZnVuY3Rpb24ocGFyYW1zKSB7XHJcblxyXG4gICAgICAgICAgICBwcm9wVG9vbHMuZGVmaW5lR2V0dGVyKHRoaXMsICdhY3Rpb24nLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zLmFjdGlvbiAmJiBwYXJhbXMubmF2QmFyKCkgP1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtcy5uYXZCYXIoKVtwYXJhbXMuYWN0aW9uXSgpIDpcclxuICAgICAgICAgICAgICAgICAgICBudWxsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8vIHVubGFiZWxlZC1pbnB1dFxyXG4gICAga28uY29tcG9uZW50cy5yZWdpc3RlcignYXBwLXVubGFiZWxlZC1pbnB1dCcsIHtcclxuICAgICAgICB0ZW1wbGF0ZTogeyBlbGVtZW50OiAndW5sYWJlbGVkLWlucHV0LXRlbXBsYXRlJyB9LFxyXG4gICAgICAgIHZpZXdNb2RlbDogZnVuY3Rpb24ocGFyYW1zKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gZ2V0T2JzZXJ2YWJsZShwYXJhbXMudmFsdWUpO1xyXG4gICAgICAgICAgICB0aGlzLnBsYWNlaG9sZGVyID0gZ2V0T2JzZXJ2YWJsZShwYXJhbXMucGxhY2Vob2xkZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmRpc2FibGUgPSBnZXRPYnNlcnZhYmxlKHBhcmFtcy5kaXNhYmxlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8vIGZlZWRiYWNrLWVudHJ5XHJcbiAgICBrby5jb21wb25lbnRzLnJlZ2lzdGVyKCdhcHAtZmVlZGJhY2stZW50cnknLCB7XHJcbiAgICAgICAgdGVtcGxhdGU6IHsgZWxlbWVudDogJ2ZlZWRiYWNrLWVudHJ5LXRlbXBsYXRlJyB9LFxyXG4gICAgICAgIHZpZXdNb2RlbDogZnVuY3Rpb24ocGFyYW1zKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNlY3Rpb24gPSBnZXRPYnNlcnZhYmxlKHBhcmFtcy5zZWN0aW9uIHx8ICcnKTtcclxuICAgICAgICAgICAgdGhpcy51cmwgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJy9mZWVkYmFjay8nICsgdGhpcy5zZWN0aW9uKCk7XHJcbiAgICAgICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLy8gZmVlZGJhY2stZW50cnlcclxuICAgIGtvLmNvbXBvbmVudHMucmVnaXN0ZXIoJ2FwcC10aW1lLXNsb3QtdGlsZScsIHtcclxuICAgICAgICB0ZW1wbGF0ZTogeyBlbGVtZW50OiAndGltZS1zbG90LXRpbGUtdGVtcGxhdGUnIH0sXHJcbiAgICAgICAgdmlld01vZGVsOiByZXF1aXJlKCcuL3ZpZXdtb2RlbHMvVGltZVNsb3QnKVxyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgTmF2YmFyIGV4dGVuc2lvbiBvZiB0aGUgQXBwLFxyXG4gICAgYWRkcyB0aGUgZWxlbWVudHMgdG8gbWFuYWdlIGEgdmlldyBtb2RlbFxyXG4gICAgZm9yIHRoZSBOYXZCYXIgYW5kIGF1dG9tYXRpYyBjaGFuZ2VzXHJcbiAgICB1bmRlciBzb21lIG1vZGVsIGNoYW5nZXMgbGlrZSB1c2VyIGxvZ2luL2xvZ291dFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIE5hdkJhciA9IHJlcXVpcmUoJy4vdmlld21vZGVscy9OYXZCYXInKSxcclxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcclxuXHJcbmV4cG9ydHMuZXh0ZW5kcyA9IGZ1bmN0aW9uIChhcHApIHtcclxuICAgIFxyXG4gICAgLy8gUkVWSUVXOiBzdGlsbCBuZWVkZWQ/IE1heWJlIHRoZSBwZXIgYWN0aXZpdHkgbmF2QmFyIG1lYW5zXHJcbiAgICAvLyB0aGlzIGlzIG5vdCBuZWVkZWQuIFNvbWUgcHJldmlvdXMgbG9naWMgd2FzIGFscmVhZHkgcmVtb3ZlZFxyXG4gICAgLy8gYmVjYXVzZSB3YXMgdXNlbGVzcy5cclxuICAgIC8vXHJcbiAgICAvLyBBZGp1c3QgdGhlIG5hdmJhciBzZXR1cCBkZXBlbmRpbmcgb24gY3VycmVudCB1c2VyLFxyXG4gICAgLy8gc2luY2UgZGlmZmVyZW50IHRoaW5ncyBhcmUgbmVlZCBmb3IgbG9nZ2VkLWluL291dC5cclxuICAgIGZ1bmN0aW9uIGFkanVzdFVzZXJCYXIoKSB7XHJcblxyXG4gICAgICAgIHZhciB1c2VyID0gYXBwLm1vZGVsLnVzZXIoKTtcclxuXHJcbiAgICAgICAgaWYgKHVzZXIuaXNBbm9ueW1vdXMoKSkge1xyXG4gICAgICAgICAgICBhcHAubmF2QmFyKCkucmlnaHRBY3Rpb24oTmF2QWN0aW9uLm1lbnVPdXQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIENvbW1lbnRlZCBsaW5lcywgdXNlZCBwcmV2aW91c2x5IGJ1dCB1bnVzZWQgbm93LCBpdCBtdXN0IGJlIGVub3VnaCB3aXRoIHRoZSB1cGRhdGVcclxuICAgIC8vIHBlciBhY3Rpdml0eSBjaGFuZ2VcclxuICAgIC8vYXBwLm1vZGVsLnVzZXIoKS5pc0Fub255bW91cy5zdWJzY3JpYmUodXBkYXRlU3RhdGVzT25Vc2VyQ2hhbmdlKTtcclxuICAgIC8vYXBwLm1vZGVsLnVzZXIoKS5vbmJvYXJkaW5nU3RlcC5zdWJzY3JpYmUodXBkYXRlU3RhdGVzT25Vc2VyQ2hhbmdlKTtcclxuICAgIFxyXG4gICAgYXBwLm5hdkJhciA9IGtvLm9ic2VydmFibGUobnVsbCk7XHJcbiAgICBcclxuICAgIHZhciByZWZyZXNoTmF2ID0gZnVuY3Rpb24gcmVmcmVzaE5hdigpIHtcclxuICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50IHRvIGZvcmNlIGEgY29tcG9uZW50IHVwZGF0ZVxyXG4gICAgICAgICQoJy5BcHBOYXYnKS50cmlnZ2VyKCdjb250ZW50Q2hhbmdlJyk7XHJcbiAgICB9O1xyXG4gICAgdmFyIGF1dG9SZWZyZXNoTmF2ID0gZnVuY3Rpb24gYXV0b1JlZnJlc2hOYXYoYWN0aW9uKSB7XHJcbiAgICAgICAgaWYgKGFjdGlvbikge1xyXG4gICAgICAgICAgICBhY3Rpb24udGV4dC5zdWJzY3JpYmUocmVmcmVzaE5hdik7XHJcbiAgICAgICAgICAgIGFjdGlvbi5pc1RpdGxlLnN1YnNjcmliZShyZWZyZXNoTmF2KTtcclxuICAgICAgICAgICAgYWN0aW9uLmljb24uc3Vic2NyaWJlKHJlZnJlc2hOYXYpO1xyXG4gICAgICAgICAgICBhY3Rpb24uaXNNZW51LnN1YnNjcmliZShyZWZyZXNoTmF2KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICAgIFVwZGF0ZSB0aGUgbmF2IG1vZGVsIHVzaW5nIHRoZSBBY3Rpdml0eSBkZWZhdWx0c1xyXG4gICAgKiovXHJcbiAgICBhcHAudXBkYXRlQXBwTmF2ID0gZnVuY3Rpb24gdXBkYXRlQXBwTmF2KGFjdGl2aXR5KSB7XHJcblxyXG4gICAgICAgIC8vIGlmIHRoZSBhY3Rpdml0eSBoYXMgaXRzIG93blxyXG4gICAgICAgIGlmICgnbmF2QmFyJyBpbiBhY3Rpdml0eSkge1xyXG4gICAgICAgICAgICAvLyBVc2Ugc3BlY2lhbGl6aWVkIGFjdGl2aXR5IGJhciBkYXRhXHJcbiAgICAgICAgICAgIGFwcC5uYXZCYXIoYWN0aXZpdHkubmF2QmFyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFVzZSBkZWZhdWx0IG9uZVxyXG4gICAgICAgICAgICBhcHAubmF2QmFyKG5ldyBOYXZCYXIoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBUT0RPIERvdWJsZSBjaGVjayBpZiBuZWVkZWQuXHJcbiAgICAgICAgLy8gTGF0ZXN0IGNoYW5nZXMsIHdoZW4gbmVlZGVkXHJcbiAgICAgICAgYWRqdXN0VXNlckJhcigpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJlZnJlc2hOYXYoKTtcclxuICAgICAgICBhdXRvUmVmcmVzaE5hdihhcHAubmF2QmFyKCkubGVmdEFjdGlvbigpKTtcclxuICAgICAgICBhdXRvUmVmcmVzaE5hdihhcHAubmF2QmFyKCkucmlnaHRBY3Rpb24oKSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIFVwZGF0ZSB0aGUgYXBwIG1lbnUgdG8gaGlnaGxpZ2h0IHRoZVxyXG4gICAgICAgIGdpdmVuIGxpbmsgbmFtZVxyXG4gICAgKiovXHJcbiAgICBhcHAudXBkYXRlTWVudSA9IGZ1bmN0aW9uIHVwZGF0ZU1lbnUobmFtZSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciAkbWVudSA9ICQoJy5BcHAtbWVudXMgLm5hdmJhci1jb2xsYXBzZScpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFJlbW92ZSBhbnkgYWN0aXZlXHJcbiAgICAgICAgJG1lbnVcclxuICAgICAgICAuZmluZCgnbGknKVxyXG4gICAgICAgIC5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgLy8gQWRkIGFjdGl2ZVxyXG4gICAgICAgICRtZW51XHJcbiAgICAgICAgLmZpbmQoJy5nby0nICsgbmFtZSlcclxuICAgICAgICAuY2xvc2VzdCgnbGknKVxyXG4gICAgICAgIC5hZGRDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgLy8gSGlkZSBtZW51XHJcbiAgICAgICAgJG1lbnVcclxuICAgICAgICAuZmlsdGVyKCc6dmlzaWJsZScpXHJcbiAgICAgICAgLmNvbGxhcHNlKCdoaWRlJyk7XHJcbiAgICB9O1xyXG59O1xyXG4iLCIvKipcclxuICAgIExpc3Qgb2YgYWN0aXZpdGllcyBsb2FkZWQgaW4gdGhlIEFwcCxcclxuICAgIGFzIGFuIG9iamVjdCB3aXRoIHRoZSBhY3Rpdml0eSBuYW1lIGFzIHRoZSBrZXlcclxuICAgIGFuZCB0aGUgY29udHJvbGxlciBhcyB2YWx1ZS5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgJ2NhbGVuZGFyJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NhbGVuZGFyJyksXHJcbiAgICAnZGF0ZXRpbWVQaWNrZXInOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvZGF0ZXRpbWVQaWNrZXInKSxcclxuICAgICdjbGllbnRzJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NsaWVudHMnKSxcclxuICAgICdzZXJ2aWNlcyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9zZXJ2aWNlcycpLFxyXG4gICAgJ2xvY2F0aW9ucyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9sb2NhdGlvbnMnKSxcclxuICAgICd0ZXh0RWRpdG9yJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL3RleHRFZGl0b3InKSxcclxuICAgICdob21lJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2hvbWUnKSxcclxuICAgICdhcHBvaW50bWVudCc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9hcHBvaW50bWVudCcpLFxyXG4gICAgJ2Jvb2tpbmdDb25maXJtYXRpb24nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvYm9va2luZ0NvbmZpcm1hdGlvbicpLFxyXG4gICAgJ2luZGV4JzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2luZGV4JyksXHJcbiAgICAnbG9naW4nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvbG9naW4nKSxcclxuICAgICdsb2dvdXQnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvbG9nb3V0JyksXHJcbiAgICAnbGVhcm5Nb3JlJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2xlYXJuTW9yZScpLFxyXG4gICAgJ3NpZ251cCc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9zaWdudXAnKSxcclxuICAgICdjb250YWN0SW5mbyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jb250YWN0SW5mbycpLFxyXG4gICAgJ29uYm9hcmRpbmdQb3NpdGlvbnMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvb25ib2FyZGluZ1Bvc2l0aW9ucycpLFxyXG4gICAgJ29uYm9hcmRpbmdIb21lJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL29uYm9hcmRpbmdIb21lJyksXHJcbiAgICAnbG9jYXRpb25FZGl0aW9uJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2xvY2F0aW9uRWRpdGlvbicpLFxyXG4gICAgJ29uYm9hcmRpbmdDb21wbGV0ZSc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9vbmJvYXJkaW5nQ29tcGxldGUnKSxcclxuICAgICdhY2NvdW50JzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2FjY291bnQnKSxcclxuICAgICdpbmJveCc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9pbmJveCcpLFxyXG4gICAgJ2NvbnZlcnNhdGlvbic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jb252ZXJzYXRpb24nKSxcclxuICAgICdzY2hlZHVsaW5nJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL3NjaGVkdWxpbmcnKSxcclxuICAgICdqb2J0aXRsZXMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvam9idGl0bGVzJyksXHJcbiAgICAnZmVlZGJhY2snOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvZmVlZGJhY2snKSxcclxuICAgICdmYXFzJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2ZhcXMnKSxcclxuICAgICdmZWVkYmFja0Zvcm0nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvZmVlZGJhY2tGb3JtJyksXHJcbiAgICAnY29udGFjdEZvcm0nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvY29udGFjdEZvcm0nKSxcclxuICAgICdjbXMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvY21zJyksXHJcbiAgICAnY2xpZW50RWRpdGlvbic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jbGllbnRFZGl0aW9uJyksXHJcbiAgICAnc2NoZWR1bGluZ1ByZWZlcmVuY2VzJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL3NjaGVkdWxpbmdQcmVmZXJlbmNlcycpLFxyXG4gICAgJ2NhbGVuZGFyU3luY2luZyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jYWxlbmRhclN5bmNpbmcnKSxcclxuICAgICd3ZWVrbHlTY2hlZHVsZSc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy93ZWVrbHlTY2hlZHVsZScpLFxyXG4gICAgJ2Jvb2tNZUJ1dHRvbic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9ib29rTWVCdXR0b24nKSxcclxuICAgICdvd25lckluZm8nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvb3duZXJJbmZvJyksXHJcbiAgICAncHJpdmFjeVNldHRpbmdzJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL3ByaXZhY3lTZXR0aW5ncycpXHJcbn07XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKiBHbG9iYWwgZGVwZW5kZW5jaWVzICoqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnktbW9iaWxlJyk7XHJcbnJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5Lm11bHRpbGluZScpO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG5rby5iaW5kaW5nSGFuZGxlcnMuZm9ybWF0ID0gcmVxdWlyZSgna28vZm9ybWF0QmluZGluZycpLmZvcm1hdEJpbmRpbmc7XHJcbnZhciBib290a25vY2sgPSByZXF1aXJlKCcuL3V0aWxzL2Jvb3Rrbm9ja0JpbmRpbmdIZWxwZXJzJyk7XHJcbnJlcXVpcmUoJy4vdXRpbHMvRnVuY3Rpb24ucHJvdG90eXBlLl9pbmhlcml0cycpO1xyXG5yZXF1aXJlKCcuL3V0aWxzL0Z1bmN0aW9uLnByb3RvdHlwZS5fZGVsYXllZCcpO1xyXG4vLyBQcm9taXNlIHBvbHlmaWxsLCBzbyBpdHMgbm90ICdyZXF1aXJlJ2QgcGVyIG1vZHVsZTpcclxucmVxdWlyZSgnZXM2LXByb21pc2UnKS5wb2x5ZmlsbCgpO1xyXG5cclxudmFyIGxheW91dFVwZGF0ZUV2ZW50ID0gcmVxdWlyZSgnbGF5b3V0VXBkYXRlRXZlbnQnKTtcclxudmFyIEFwcE1vZGVsID0gcmVxdWlyZSgnLi92aWV3bW9kZWxzL0FwcE1vZGVsJyk7XHJcblxyXG4vLyBSZWdpc3RlciB0aGUgc3BlY2lhbCBsb2NhbGVcclxucmVxdWlyZSgnLi9sb2NhbGVzL2VuLVVTLUxDJyk7XHJcblxyXG4vKipcclxuICAgIEEgc2V0IG9mIGZpeGVzL3dvcmthcm91bmRzIGZvciBCb290c3RyYXAgYmVoYXZpb3IvcGx1Z2luc1xyXG4gICAgdG8gYmUgZXhlY3V0ZWQgYmVmb3JlIEJvb3RzdHJhcCBpcyBpbmNsdWRlZC9leGVjdXRlZC5cclxuICAgIEZvciBleGFtcGxlLCBiZWNhdXNlIG9mIGRhdGEtYmluZGluZyByZW1vdmluZy9jcmVhdGluZyBlbGVtZW50cyxcclxuICAgIHNvbWUgb2xkIHJlZmVyZW5jZXMgdG8gcmVtb3ZlZCBpdGVtcyBtYXkgZ2V0IGFsaXZlIGFuZCBuZWVkIHVwZGF0ZSxcclxuICAgIG9yIHJlLWVuYWJsaW5nIHNvbWUgYmVoYXZpb3JzLlxyXG4qKi9cclxuZnVuY3Rpb24gcHJlQm9vdHN0cmFwV29ya2Fyb3VuZHMoKSB7XHJcbiAgICAvLyBJbnRlcm5hbCBCb290c3RyYXAgc291cmNlIHV0aWxpdHlcclxuICAgIGZ1bmN0aW9uIGdldFRhcmdldEZyb21UcmlnZ2VyKCR0cmlnZ2VyKSB7XHJcbiAgICAgICAgdmFyIGhyZWYsXHJcbiAgICAgICAgICAgIHRhcmdldCA9ICR0cmlnZ2VyLmF0dHIoJ2RhdGEtdGFyZ2V0JykgfHxcclxuICAgICAgICAgICAgKGhyZWYgPSAkdHJpZ2dlci5hdHRyKCdocmVmJykpICYmIFxyXG4gICAgICAgICAgICBocmVmLnJlcGxhY2UoLy4qKD89I1teXFxzXSskKS8sICcnKTsgLy8gc3RyaXAgZm9yIGllN1xyXG5cclxuICAgICAgICByZXR1cm4gJCh0YXJnZXQpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBCdWc6IG5hdmJhci1jb2xsYXBzZSBlbGVtZW50cyBob2xkIGEgcmVmZXJlbmNlIHRvIHRoZWlyIG9yaWdpbmFsXHJcbiAgICAvLyAkdHJpZ2dlciwgYnV0IHRoYXQgdHJpZ2dlciBjYW4gY2hhbmdlIG9uIGRpZmZlcmVudCAnY2xpY2tzJyBvclxyXG4gICAgLy8gZ2V0IHJlbW92ZWQgdGhlIG9yaWdpbmFsLCBzbyBpdCBtdXN0IHJlZmVyZW5jZSB0aGUgbmV3IG9uZVxyXG4gICAgLy8gKHRoZSBsYXRlc3RzIGNsaWNrZWQsIGFuZCBub3QgdGhlIGNhY2hlZCBvbmUgdW5kZXIgdGhlICdkYXRhJyBBUEkpLiAgICBcclxuICAgIC8vIE5PVEU6IGhhbmRsZXIgbXVzdCBleGVjdXRlIGJlZm9yZSB0aGUgQm9vdHN0cmFwIGhhbmRsZXIgZm9yIHRoZSBzYW1lXHJcbiAgICAvLyBldmVudCBpbiBvcmRlciB0byB3b3JrLlxyXG4gICAgJChkb2N1bWVudCkub24oJ2NsaWNrLmJzLmNvbGxhcHNlLmRhdGEtYXBpLndvcmthcm91bmQnLCAnW2RhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIl0nLCBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICAkdGFyZ2V0ID0gZ2V0VGFyZ2V0RnJvbVRyaWdnZXIoJHQpLFxyXG4gICAgICAgICAgICBkYXRhID0gJHRhcmdldCAmJiAkdGFyZ2V0LmRhdGEoJ2JzLmNvbGxhcHNlJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSWYgYW55XHJcbiAgICAgICAgaWYgKGRhdGEpIHtcclxuICAgICAgICAgICAgLy8gUmVwbGFjZSB0aGUgdHJpZ2dlciBpbiB0aGUgZGF0YSByZWZlcmVuY2U6XHJcbiAgICAgICAgICAgIGRhdGEuJHRyaWdnZXIgPSAkdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gT24gZWxzZSwgbm90aGluZyB0byBkbywgYSBuZXcgQ29sbGFwc2UgaW5zdGFuY2Ugd2lsbCBiZSBjcmVhdGVkXHJcbiAgICAgICAgLy8gd2l0aCB0aGUgY29ycmVjdCB0YXJnZXQsIHRoZSBmaXJzdCB0aW1lXHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAgICBBcHAgc3RhdGljIGNsYXNzXHJcbioqL1xyXG52YXIgYXBwID0ge1xyXG4gICAgc2hlbGw6IHJlcXVpcmUoJy4vYXBwLnNoZWxsJyksXHJcbiAgICBcclxuICAgIC8vIE5ldyBhcHAgbW9kZWwsIHRoYXQgc3RhcnRzIHdpdGggYW5vbnltb3VzIHVzZXJcclxuICAgIG1vZGVsOiBuZXcgQXBwTW9kZWwoKSxcclxuICAgIFxyXG4gICAgLyoqIExvYWQgYWN0aXZpdGllcyBjb250cm9sbGVycyAobm90IGluaXRpYWxpemVkKSAqKi9cclxuICAgIGFjdGl2aXRpZXM6IHJlcXVpcmUoJy4vYXBwLmFjdGl2aXRpZXMnKSxcclxuICAgIFxyXG4gICAgbW9kYWxzOiByZXF1aXJlKCcuL2FwcC5tb2RhbHMnKSxcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgSnVzdCByZWRpcmVjdCB0aGUgYmV0dGVyIHBsYWNlIGZvciBjdXJyZW50IHVzZXIgYW5kIHN0YXRlLlxyXG4gICAgICAgIE5PVEU6IEl0cyBhIGRlbGF5ZWQgZnVuY3Rpb24sIHNpbmNlIG9uIG1hbnkgY29udGV4dHMgbmVlZCB0b1xyXG4gICAgICAgIHdhaXQgZm9yIHRoZSBjdXJyZW50ICdyb3V0aW5nJyBmcm9tIGVuZCBiZWZvcmUgZG8gdGhlIG5ld1xyXG4gICAgICAgIGhpc3RvcnkgY2hhbmdlLlxyXG4gICAgICAgIFRPRE86IE1heWJlLCByYXRoZXIgdGhhbiBkZWxheSBpdCwgY2FuIHN0b3AgY3VycmVudCByb3V0aW5nXHJcbiAgICAgICAgKGNoYW5nZXMgb24gU2hlbGwgcmVxdWlyZWQpIGFuZCBwZXJmb3JtIHRoZSBuZXcuXHJcbiAgICAgICAgVE9ETzogTWF5YmUgYWx0ZXJuYXRpdmUgdG8gcHJldmlvdXMsIHRvIHByb3ZpZGUgYSAncmVwbGFjZSdcclxuICAgICAgICBpbiBzaGVsbCByYXRoZXIgdGhhbiBhIGdvLCB0byBhdm9pZCBhcHBlbmQgcmVkaXJlY3QgZW50cmllc1xyXG4gICAgICAgIGluIHRoZSBoaXN0b3J5LCB0aGF0IGNyZWF0ZSB0aGUgcHJvYmxlbSBvZiAnYnJva2VuIGJhY2sgYnV0dG9uJ1xyXG4gICAgKiovXHJcbiAgICBnb0Rhc2hib2FyZDogZnVuY3Rpb24gZ29EYXNoYm9hcmQoKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVG8gYXZvaWQgaW5maW5pdGUgbG9vcHMgaWYgd2UgYWxyZWFkeSBhcmUgcGVyZm9ybWluZyBcclxuICAgICAgICAvLyBhIGdvRGFzaGJvYXJkIHRhc2ssIHdlIGZsYWcgdGhlIGV4ZWN1dGlvblxyXG4gICAgICAgIC8vIGJlaW5nIGNhcmUgb2YgdGhlIGRlbGF5IGludHJvZHVjZWQgaW4gdGhlIGV4ZWN1dGlvblxyXG4gICAgICAgIGlmIChnb0Rhc2hib2FyZC5fZ29pbmcgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gRGVsYXllZCB0byBhdm9pZCBjb2xsaXNpb25zIHdpdGggaW4tdGhlLW1pZGRsZVxyXG4gICAgICAgICAgICAvLyB0YXNrczoganVzdCBhbGxvd2luZyBjdXJyZW50IHJvdXRpbmcgdG8gZmluaXNoXHJcbiAgICAgICAgICAgIC8vIGJlZm9yZSBwZXJmb3JtIHRoZSAncmVkaXJlY3QnXHJcbiAgICAgICAgICAgIC8vIFRPRE86IGNoYW5nZSBieSBhIHJlYWwgcmVkaXJlY3QgdGhhdCBpcyBhYmxlIHRvXHJcbiAgICAgICAgICAgIC8vIGNhbmNlbCB0aGUgY3VycmVudCBhcHAuc2hlbGwgcm91dGluZyBwcm9jZXNzLlxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZ29EYXNoYm9hcmQuX2dvaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgb25ib2FyZGluZyA9IHRoaXMubW9kZWwudXNlcigpLm9uYm9hcmRpbmdTdGVwKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG9uYm9hcmRpbmcpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNoZWxsLmdvKCdvbmJvYXJkaW5nSG9tZS8nICsgb25ib2FyZGluZyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNoZWxsLmdvKCdob21lJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSnVzdCBiZWNhdXNlIGlzIGRlbGF5ZWQsIG5lZWRzXHJcbiAgICAgICAgICAgICAgICAvLyB0byBiZSBzZXQgb2ZmIGFmdGVyIGFuIGlubWVkaWF0ZSB0byBcclxuICAgICAgICAgICAgICAgIC8vIGVuc3VyZSBpcyBzZXQgb2ZmIGFmdGVyIGFueSBvdGhlciBhdHRlbXB0XHJcbiAgICAgICAgICAgICAgICAvLyB0byBhZGQgYSBkZWxheWVkIGdvRGFzaGJvYXJkOlxyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICBnb0Rhc2hib2FyZC5fZ29pbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0sIDEpO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcyksIDEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbi8qKiBDb250aW51ZSBhcHAgY3JlYXRpb24gd2l0aCB0aGluZ3MgdGhhdCBuZWVkIGEgcmVmZXJlbmNlIHRvIHRoZSBhcHAgKiovXHJcblxyXG5yZXF1aXJlKCcuL2FwcC1uYXZiYXInKS5leHRlbmRzKGFwcCk7XHJcblxyXG5yZXF1aXJlKCcuL2FwcC1jb21wb25lbnRzJykucmVnaXN0ZXJBbGwoKTtcclxuXHJcbmFwcC5nZXRBY3Rpdml0eSA9IGZ1bmN0aW9uIGdldEFjdGl2aXR5KG5hbWUpIHtcclxuICAgIHZhciBhY3Rpdml0eSA9IHRoaXMuYWN0aXZpdGllc1tuYW1lXTtcclxuICAgIGlmIChhY3Rpdml0eSkge1xyXG4gICAgICAgIHZhciAkYWN0ID0gdGhpcy5zaGVsbC5pdGVtcy5maW5kKG5hbWUpO1xyXG4gICAgICAgIGlmICgkYWN0ICYmICRhY3QubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm4gYWN0aXZpdHkuaW5pdCgkYWN0LCB0aGlzKTtcclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG59O1xyXG5cclxuYXBwLmdldEFjdGl2aXR5Q29udHJvbGxlckJ5Um91dGUgPSBmdW5jdGlvbiBnZXRBY3Rpdml0eUNvbnRyb2xsZXJCeVJvdXRlKHJvdXRlKSB7XHJcbiAgICAvLyBGcm9tIHRoZSByb3V0ZSBvYmplY3QsIHRoZSBpbXBvcnRhbnQgcGllY2UgaXMgcm91dGUubmFtZVxyXG4gICAgLy8gdGhhdCBjb250YWlucyB0aGUgYWN0aXZpdHkgbmFtZSBleGNlcHQgaWYgaXMgdGhlIHJvb3RcclxuICAgIHZhciBhY3ROYW1lID0gcm91dGUubmFtZSB8fCB0aGlzLnNoZWxsLmluZGV4TmFtZTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHRoaXMuZ2V0QWN0aXZpdHkoYWN0TmFtZSk7XHJcbn07XHJcblxyXG4vLyBhY2Nlc3NDb250cm9sIHNldHVwOiBjYW5ub3QgYmUgc3BlY2lmaWVkIG9uIFNoZWxsIGNyZWF0aW9uIGJlY2F1c2VcclxuLy8gZGVwZW5kcyBvbiB0aGUgYXBwIGluc3RhbmNlXHJcbmFwcC5zaGVsbC5hY2Nlc3NDb250cm9sID0gcmVxdWlyZSgnLi91dGlscy9hY2Nlc3NDb250cm9sJykoYXBwKTtcclxuXHJcbi8vIFNob3J0Y3V0IHRvIFVzZXJUeXBlIGVudW1lcmF0aW9uIHVzZWQgdG8gc2V0IHBlcm1pc3Npb25zXHJcbmFwcC5Vc2VyVHlwZSA9IGFwcC5tb2RlbC51c2VyKCkuY29uc3RydWN0b3IuVXNlclR5cGU7XHJcblxyXG4vKiogQXBwIEluaXQgKiovXHJcbnZhciBhcHBJbml0ID0gZnVuY3Rpb24gYXBwSW5pdCgpIHtcclxuICAgIC8qanNoaW50IG1heHN0YXRlbWVudHM6NTAsbWF4Y29tcGxleGl0eToxNiAqL1xyXG4gICAgXHJcbiAgICAvLyBFbmFibGluZyB0aGUgJ2xheW91dFVwZGF0ZScgalF1ZXJ5IFdpbmRvdyBldmVudCB0aGF0IGhhcHBlbnMgb24gcmVzaXplIGFuZCB0cmFuc2l0aW9uZW5kLFxyXG4gICAgLy8gYW5kIGNhbiBiZSB0cmlnZ2VyZWQgbWFudWFsbHkgYnkgYW55IHNjcmlwdCB0byBub3RpZnkgY2hhbmdlcyBvbiBsYXlvdXQgdGhhdFxyXG4gICAgLy8gbWF5IHJlcXVpcmUgYWRqdXN0bWVudHMgb24gb3RoZXIgc2NyaXB0cyB0aGF0IGxpc3RlbiB0byBpdC5cclxuICAgIC8vIFRoZSBldmVudCBpcyB0aHJvdHRsZSwgZ3VhcmFudGluZyB0aGF0IHRoZSBtaW5vciBoYW5kbGVycyBhcmUgZXhlY3V0ZWQgcmF0aGVyXHJcbiAgICAvLyB0aGFuIGEgbG90IG9mIHRoZW0gaW4gc2hvcnQgdGltZSBmcmFtZXMgKGFzIGhhcHBlbiB3aXRoICdyZXNpemUnIGV2ZW50cykuXHJcbiAgICBsYXlvdXRVcGRhdGVFdmVudC5sYXlvdXRVcGRhdGVFdmVudCArPSAnIG9yaWVudGF0aW9uY2hhbmdlJztcclxuICAgIGxheW91dFVwZGF0ZUV2ZW50Lm9uKCk7XHJcbiAgICBcclxuICAgIC8vIEtleWJvYXJkIHBsdWdpbiBldmVudHMgYXJlIG5vdCBjb21wYXRpYmxlIHdpdGggalF1ZXJ5IGV2ZW50cywgYnV0IG5lZWRlZCB0b1xyXG4gICAgLy8gdHJpZ2dlciBhIGxheW91dFVwZGF0ZSwgc28gaGVyZSBhcmUgY29ubmVjdGVkLCBtYWlubHkgZml4aW5nIGJ1Z3Mgb24gaU9TIHdoZW4gdGhlIGtleWJvYXJkXHJcbiAgICAvLyBpcyBoaWRkaW5nLlxyXG4gICAgdmFyIHRyaWdMYXlvdXQgPSBmdW5jdGlvbiB0cmlnTGF5b3V0KCkge1xyXG4gICAgICAgICQod2luZG93KS50cmlnZ2VyKCdsYXlvdXRVcGRhdGUnKTtcclxuICAgIH07XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbmF0aXZlLmtleWJvYXJkc2hvdycsIHRyaWdMYXlvdXQpO1xyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ25hdGl2ZS5rZXlib2FyZGhpZGUnLCB0cmlnTGF5b3V0KTtcclxuXHJcbiAgICAvLyBpT1MtNysgc3RhdHVzIGJhciBmaXguIEFwcGx5IG9uIHBsdWdpbiBsb2FkZWQgKGNvcmRvdmEvcGhvbmVnYXAgZW52aXJvbm1lbnQpXHJcbiAgICAvLyBhbmQgaW4gYW55IHN5c3RlbSwgc28gYW55IG90aGVyIHN5c3RlbXMgZml4IGl0cyBzb2x2ZWQgdG9vIGlmIG5lZWRlZCBcclxuICAgIC8vIGp1c3QgdXBkYXRpbmcgdGhlIHBsdWdpbiAoZnV0dXJlIHByb29mKSBhbmQgZW5zdXJlIGhvbW9nZW5lb3VzIGNyb3NzIHBsYWZ0Zm9ybSBiZWhhdmlvci5cclxuICAgIGlmICh3aW5kb3cuU3RhdHVzQmFyKSB7XHJcbiAgICAgICAgLy8gRml4IGlPUy03KyBvdmVybGF5IHByb2JsZW1cclxuICAgICAgICAvLyBJcyBpbiBjb25maWcueG1sIHRvbywgYnV0IHNlZW1zIG5vdCB0byB3b3JrIHdpdGhvdXQgbmV4dCBjYWxsOlxyXG4gICAgICAgIHdpbmRvdy5TdGF0dXNCYXIub3ZlcmxheXNXZWJWaWV3KGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgaU9zV2VidmlldyA9IGZhbHNlO1xyXG4gICAgaWYgKHdpbmRvdy5kZXZpY2UgJiYgXHJcbiAgICAgICAgL2lPU3xpUGFkfGlQaG9uZXxpUG9kL2kudGVzdCh3aW5kb3cuZGV2aWNlLnBsYXRmb3JtKSkge1xyXG4gICAgICAgIGlPc1dlYnZpZXcgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBOT1RFOiBTYWZhcmkgaU9TIGJ1ZyB3b3JrYXJvdW5kLCBtaW4taGVpZ2h0L2hlaWdodCBvbiBodG1sIGRvZXNuJ3Qgd29yayBhcyBleHBlY3RlZCxcclxuICAgIC8vIGdldHRpbmcgYmlnZ2VyIHRoYW4gdmlld3BvcnQuXHJcbiAgICB2YXIgaU9TID0gLyhpUGFkfGlQaG9uZXxpUG9kKS9nLnRlc3QoIG5hdmlnYXRvci51c2VyQWdlbnQgKTtcclxuICAgIGlmIChpT1MpIHtcclxuICAgICAgICB2YXIgZ2V0SGVpZ2h0ID0gZnVuY3Rpb24gZ2V0SGVpZ2h0KCkge1xyXG4gICAgICAgICAgICByZXR1cm4gd2luZG93LmlubmVySGVpZ2h0O1xyXG4gICAgICAgICAgICAvLyBJbiBjYXNlIG9mIGVuYWJsZSB0cmFuc3BhcmVudC9vdmVybGF5IFN0YXR1c0JhcjpcclxuICAgICAgICAgICAgLy8gKHdpbmRvdy5pbm5lckhlaWdodCAtIChpT3NXZWJ2aWV3ID8gMjAgOiAwKSlcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgICQoJ2h0bWwnKS5oZWlnaHQoZ2V0SGVpZ2h0KCkgKyAncHgnKTsgICAgICAgIFxyXG4gICAgICAgICQod2luZG93KS5vbignbGF5b3V0VXBkYXRlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICQoJ2h0bWwnKS5oZWlnaHQoZ2V0SGVpZ2h0KCkgKyAncHgnKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBCZWNhdXNlIG9mIHRoZSBpT1M3KzggYnVncyB3aXRoIGhlaWdodCBjYWxjdWxhdGlvbixcclxuICAgIC8vIGEgZGlmZmVyZW50IHdheSBvZiBhcHBseSBjb250ZW50IGhlaWdodCB0byBmaWxsIGFsbCB0aGUgYXZhaWxhYmxlIGhlaWdodCAoYXMgbWluaW11bSlcclxuICAgIC8vIGlzIHJlcXVpcmVkLlxyXG4gICAgLy8gRm9yIHRoYXQsIHRoZSAnZnVsbC1oZWlnaHQnIGNsYXNzIHdhcyBhZGRlZCwgdG8gYmUgdXNlZCBpbiBlbGVtZW50cyBpbnNpZGUgdGhlIFxyXG4gICAgLy8gYWN0aXZpdHkgdGhhdCBuZWVkcyBhbGwgdGhlIGF2YWlsYWJsZSBoZWlnaHQsIGhlcmUgdGhlIGNhbGN1bGF0aW9uIGlzIGFwcGxpZWQgZm9yXHJcbiAgICAvLyBhbGwgcGxhdGZvcm1zIGZvciB0aGlzIGhvbW9nZW5lb3VzIGFwcHJvYWNoIHRvIHNvbHZlIHRoZSBwcm9ibGVtbS5cclxuICAgIChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgJGIgPSAkKCdib2R5Jyk7XHJcbiAgICAgICAgdmFyIGZ1bGxIZWlnaHQgPSBmdW5jdGlvbiBmdWxsSGVpZ2h0KCkge1xyXG4gICAgICAgICAgICB2YXIgaCA9ICRiLmhlaWdodCgpO1xyXG4gICAgICAgICAgICAkKCcuZnVsbC1oZWlnaHQnKVxyXG4gICAgICAgICAgICAvLyBMZXQgYnJvd3NlciB0byBjb21wdXRlXHJcbiAgICAgICAgICAgIC5jc3MoJ2hlaWdodCcsICdhdXRvJylcclxuICAgICAgICAgICAgLy8gQXMgbWluaW11bVxyXG4gICAgICAgICAgICAuY3NzKCdtaW4taGVpZ2h0JywgaClcclxuICAgICAgICAgICAgLy8gU2V0IGV4cGxpY2l0IHRoZSBhdXRvbWF0aWMgY29tcHV0ZWQgaGVpZ2h0XHJcbiAgICAgICAgICAgIC5jc3MoJ2hlaWdodCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gd2UgdXNlIGJveC1zaXppbmc6Ym9yZGVyLWJveCwgc28gbmVlZHMgdG8gYmUgb3V0ZXJIZWlnaHQgd2l0aG91dCBtYXJnaW46XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJCh0aGlzKS5vdXRlckhlaWdodChmYWxzZSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGZ1bGxIZWlnaHQoKTtcclxuICAgICAgICAkKHdpbmRvdykub24oJ2xheW91dFVwZGF0ZScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBmdWxsSGVpZ2h0KCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KSgpO1xyXG4gICAgXHJcbiAgICAvLyBGb3JjZSBhbiB1cGRhdGUgZGVsYXllZCB0byBlbnN1cmUgdXBkYXRlIGFmdGVyIHNvbWUgdGhpbmdzIGRpZCBhZGRpdGlvbmFsIHdvcmtcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ2xheW91dFVwZGF0ZScpO1xyXG4gICAgfSwgMjAwKTtcclxuICAgIFxyXG4gICAgLy8gQm9vdHN0cmFwXHJcbiAgICBwcmVCb290c3RyYXBXb3JrYXJvdW5kcygpO1xyXG4gICAgcmVxdWlyZSgnYm9vdHN0cmFwJyk7XHJcbiAgICBcclxuICAgIC8vIExvYWQgS25vY2tvdXQgYmluZGluZyBoZWxwZXJzXHJcbiAgICBib290a25vY2sucGx1Z0luKGtvKTtcclxuICAgIHJlcXVpcmUoJy4vdXRpbHMvYm9vdHN0cmFwU3dpdGNoQmluZGluZycpLnBsdWdJbihrbyk7XHJcbiAgICBcclxuICAgIC8vIFBsdWdpbnMgc2V0dXBcclxuICAgIGlmICh3aW5kb3cuY29yZG92YSAmJiB3aW5kb3cuY29yZG92YS5wbHVnaW5zICYmIHdpbmRvdy5jb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQpIHtcclxuICAgICAgICB3aW5kb3cuY29yZG92YS5wbHVnaW5zLktleWJvYXJkLmRpc2FibGVTY3JvbGwodHJ1ZSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEVhc3kgbGlua3MgdG8gc2hlbGwgYWN0aW9ucywgbGlrZSBnb0JhY2ssIGluIGh0bWwgZWxlbWVudHNcclxuICAgIC8vIEV4YW1wbGU6IDxidXR0b24gZGF0YS1zaGVsbD1cImdvQmFjayAyXCI+R28gMiB0aW1lcyBiYWNrPC9idXR0b24+XHJcbiAgICAvLyBOT1RFOiBJbXBvcnRhbnQsIHJlZ2lzdGVyZWQgYmVmb3JlIHRoZSBzaGVsbC5ydW4gdG8gYmUgZXhlY3V0ZWRcclxuICAgIC8vIGJlZm9yZSBpdHMgJ2NhdGNoIGFsbCBsaW5rcycgaGFuZGxlclxyXG4gICAgJChkb2N1bWVudCkub24oJ3RhcCcsICdbZGF0YS1zaGVsbF0nLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgLy8gVXNpbmcgYXR0ciByYXRoZXIgdGhhbiB0aGUgJ2RhdGEnIEFQSSB0byBnZXQgdXBkYXRlZFxyXG4gICAgICAgIC8vIERPTSB2YWx1ZXNcclxuICAgICAgICB2YXIgY21kbGluZSA9ICQodGhpcykuYXR0cignZGF0YS1zaGVsbCcpIHx8ICcnLFxyXG4gICAgICAgICAgICBhcmdzID0gY21kbGluZS5zcGxpdCgnICcpLFxyXG4gICAgICAgICAgICBjbWQgPSBhcmdzWzBdO1xyXG5cclxuICAgICAgICBpZiAoY21kICYmIHR5cGVvZihhcHAuc2hlbGxbY21kXSkgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgYXBwLnNoZWxsW2NtZF0uYXBwbHkoYXBwLnNoZWxsLCBhcmdzLnNsaWNlKDEpKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIENhbmNlbCBhbnkgb3RoZXIgYWN0aW9uIG9uIHRoZSBsaW5rLCB0byBhdm9pZCBkb3VibGUgbGlua2luZyByZXN1bHRzXHJcbiAgICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gT24gQ29yZG92YS9QaG9uZWdhcCBhcHAsIHNwZWNpYWwgdGFyZ2V0cyBtdXN0IGJlIGNhbGxlZCB1c2luZyB0aGUgd2luZG93Lm9wZW5cclxuICAgIC8vIEFQSSB0byBlbnN1cmUgaXMgY29ycmVjdGx5IG9wZW5lZCBvbiB0aGUgSW5BcHBCcm93c2VyIChfYmxhbmspIG9yIHN5c3RlbSBkZWZhdWx0XHJcbiAgICAvLyBicm93c2VyIChfc3lzdGVtKS5cclxuICAgIGlmICh3aW5kb3cuY29yZG92YSkge1xyXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCd0YXAnLCAnW3RhcmdldD1cIl9ibGFua1wiXSwgW3RhcmdldD1cIl9zeXN0ZW1cIl0nLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5vcGVuKHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJyksIHRoaXMuZ2V0QXR0cmlidXRlKCd0YXJnZXQnKSk7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gV2hlbiBhbiBhY3Rpdml0eSBpcyByZWFkeSBpbiB0aGUgU2hlbGw6XHJcbiAgICBhcHAuc2hlbGwub24oYXBwLnNoZWxsLmV2ZW50cy5pdGVtUmVhZHksIGZ1bmN0aW9uKCRhY3QsIHN0YXRlKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQ29ubmVjdCB0aGUgJ2FjdGl2aXRpZXMnIGNvbnRyb2xsZXJzIHRvIHRoZWlyIHZpZXdzXHJcbiAgICAgICAgLy8gR2V0IGluaXRpYWxpemVkIGFjdGl2aXR5IGZvciB0aGUgRE9NIGVsZW1lbnRcclxuICAgICAgICB2YXIgYWN0TmFtZSA9ICRhY3QuZGF0YSgnYWN0aXZpdHknKTtcclxuICAgICAgICB2YXIgYWN0aXZpdHkgPSBhcHAuZ2V0QWN0aXZpdHkoYWN0TmFtZSk7XHJcbiAgICAgICAgLy8gVHJpZ2dlciB0aGUgJ3Nob3cnIGxvZ2ljIG9mIHRoZSBhY3Rpdml0eSBjb250cm9sbGVyOlxyXG4gICAgICAgIGFjdGl2aXR5LnNob3coc3RhdGUpO1xyXG5cclxuICAgICAgICAvLyBVcGRhdGUgbWVudVxyXG4gICAgICAgIHZhciBtZW51SXRlbSA9IGFjdGl2aXR5Lm1lbnVJdGVtIHx8IGFjdE5hbWU7XHJcbiAgICAgICAgYXBwLnVwZGF0ZU1lbnUobWVudUl0ZW0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFVwZGF0ZSBhcHAgbmF2aWdhdGlvblxyXG4gICAgICAgIGFwcC51cGRhdGVBcHBOYXYoYWN0aXZpdHkpO1xyXG4gICAgfSk7XHJcbiAgICAvLyBXaGVuIGFuIGFjdGl2aXR5IGlzIGhpZGRlblxyXG4gICAgYXBwLnNoZWxsLm9uKGFwcC5zaGVsbC5ldmVudHMuY2xvc2VkLCBmdW5jdGlvbigkYWN0KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQ29ubmVjdCB0aGUgJ2FjdGl2aXRpZXMnIGNvbnRyb2xsZXJzIHRvIHRoZWlyIHZpZXdzXHJcbiAgICAgICAgdmFyIGFjdE5hbWUgPSAkYWN0LmRhdGEoJ2FjdGl2aXR5Jyk7XHJcbiAgICAgICAgdmFyIGFjdGl2aXR5ID0gYXBwLmdldEFjdGl2aXR5KGFjdE5hbWUpO1xyXG4gICAgICAgIC8vIFRyaWdnZXIgdGhlICdoaWRlJyBsb2dpYyBvZiB0aGUgYWN0aXZpdHkgY29udHJvbGxlcjpcclxuICAgICAgICBpZiAoYWN0aXZpdHkuaGlkZSlcclxuICAgICAgICAgICAgYWN0aXZpdHkuaGlkZSgpO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIFNldCBtb2RlbCBmb3IgdGhlIEFwcE5hdlxyXG4gICAga28uYXBwbHlCaW5kaW5ncyh7XHJcbiAgICAgICAgbmF2QmFyOiBhcHAubmF2QmFyXHJcbiAgICB9LCAkKCcuQXBwTmF2JykuZ2V0KDApKTtcclxuICAgIFxyXG4gICAgdmFyIFNtYXJ0TmF2QmFyID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL1NtYXJ0TmF2QmFyJyk7XHJcbiAgICB2YXIgbmF2QmFycyA9IFNtYXJ0TmF2QmFyLmdldEFsbCgpO1xyXG4gICAgLy8gQ3JlYXRlcyBhbiBldmVudCBieSBsaXN0ZW5pbmcgdG8gaXQsIHNvIG90aGVyIHNjcmlwdHMgY2FuIHRyaWdnZXJcclxuICAgIC8vIGEgJ2NvbnRlbnRDaGFuZ2UnIGV2ZW50IHRvIGZvcmNlIGEgcmVmcmVzaCBvZiB0aGUgbmF2YmFyICh0byBcclxuICAgIC8vIGNhbGN1bGF0ZSBhbmQgYXBwbHkgYSBuZXcgc2l6ZSk7IGV4cGVjdGVkIGZyb20gZHluYW1pYyBuYXZiYXJzXHJcbiAgICAvLyB0aGF0IGNoYW5nZSBpdCBjb250ZW50IGJhc2VkIG9uIG9ic2VydmFibGVzLlxyXG4gICAgbmF2QmFycy5mb3JFYWNoKGZ1bmN0aW9uKG5hdmJhcikge1xyXG4gICAgICAgICQobmF2YmFyLmVsKS5vbignY29udGVudENoYW5nZScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBuYXZiYXIucmVmcmVzaCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIExpc3RlbiBmb3IgbWVudSBldmVudHMgKGNvbGxhcHNlIGluIFNtYXJ0TmF2QmFyKVxyXG4gICAgLy8gdG8gYXBwbHkgdGhlIGJhY2tkcm9wXHJcbiAgICB2YXIgdG9nZ2xpbmdCYWNrZHJvcCA9IGZhbHNlO1xyXG4gICAgJChkb2N1bWVudCkub24oJ3Nob3cuYnMuY29sbGFwc2UgaGlkZS5icy5jb2xsYXBzZScsICcuQXBwTmF2IC5uYXZiYXItY29sbGFwc2UnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgaWYgKCF0b2dnbGluZ0JhY2tkcm9wKSB7XHJcbiAgICAgICAgICAgIHRvZ2dsaW5nQmFja2Ryb3AgPSB0cnVlO1xyXG4gICAgICAgICAgICB2YXIgZW5hYmxlZCA9IGUudHlwZSA9PT0gJ3Nob3cnO1xyXG4gICAgICAgICAgICAkKCdib2R5JykudG9nZ2xlQ2xhc3MoJ3VzZS1iYWNrZHJvcCcsIGVuYWJsZWQpO1xyXG4gICAgICAgICAgICAvLyBIaWRlIGFueSBvdGhlciBvcGVuZWQgY29sbGFwc2VcclxuICAgICAgICAgICAgJCgnLmNvbGxhcHNpbmcsIC5jb2xsYXBzZS5pbicpLmNvbGxhcHNlKCdoaWRlJyk7XHJcbiAgICAgICAgICAgIHRvZ2dsaW5nQmFja2Ryb3AgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBcHAgaW5pdDpcclxuICAgIHZhciBhbGVydEVycm9yID0gZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgd2luZG93LmFsZXJ0KCdUaGVyZSB3YXMgYW4gZXJyb3IgbG9hZGluZzogJyArIGVyciAmJiBlcnIubWVzc2FnZSB8fCBlcnIpO1xyXG4gICAgfTtcclxuXHJcbiAgICBhcHAubW9kZWwuaW5pdCgpXHJcbiAgICAudGhlbihhcHAuc2hlbGwucnVuLmJpbmQoYXBwLnNoZWxsKSwgYWxlcnRFcnJvcilcclxuICAgIC50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIE1hcmsgdGhlIHBhZ2UgYXMgcmVhZHlcclxuICAgICAgICAkKCdodG1sJykuYWRkQ2xhc3MoJ2lzLXJlYWR5Jyk7XHJcbiAgICAgICAgLy8gQXMgYXBwLCBoaWRlcyBzcGxhc2ggc2NyZWVuXHJcbiAgICAgICAgaWYgKHdpbmRvdy5uYXZpZ2F0b3IgJiYgd2luZG93Lm5hdmlnYXRvci5zcGxhc2hzY3JlZW4pIHtcclxuICAgICAgICAgICAgd2luZG93Lm5hdmlnYXRvci5zcGxhc2hzY3JlZW4uaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sIGFsZXJ0RXJyb3IpO1xyXG5cclxuICAgIC8vIERFQlVHXHJcbiAgICB3aW5kb3cuYXBwID0gYXBwO1xyXG59O1xyXG5cclxuLy8gQXBwIGluaXQgb24gcGFnZSByZWFkeSBhbmQgcGhvbmVnYXAgcmVhZHlcclxuaWYgKHdpbmRvdy5jb3Jkb3ZhKSB7XHJcbiAgICAvLyBPbiBET00tUmVhZHkgZmlyc3RcclxuICAgICQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgLy8gUGFnZSBpcyByZWFkeSwgZGV2aWNlIGlzIHRvbz9cclxuICAgICAgICAvLyBOb3RlOiBDb3Jkb3ZhIGVuc3VyZXMgdG8gY2FsbCB0aGUgaGFuZGxlciBldmVuIGlmIHRoZVxyXG4gICAgICAgIC8vIGV2ZW50IHdhcyBhbHJlYWR5IGZpcmVkLCBzbyBpcyBnb29kIHRvIGRvIGl0IGluc2lkZVxyXG4gICAgICAgIC8vIHRoZSBkb20tcmVhZHkgYW5kIHdlIGFyZSBlbnN1cmluZyB0aGF0IGV2ZXJ5dGhpbmcgaXNcclxuICAgICAgICAvLyByZWFkeS5cclxuICAgICAgICAkKGRvY3VtZW50KS5vbignZGV2aWNlcmVhZHknLCBhcHBJbml0KTtcclxuICAgIH0pO1xyXG59IGVsc2Uge1xyXG4gICAgLy8gT25seSBvbiBET00tUmVhZHksIGZvciBpbiBicm93c2VyIGRldmVsb3BtZW50XHJcbiAgICAkKGFwcEluaXQpO1xyXG59XHJcbiIsIi8qKlxyXG4gICAgQWNjZXNzIHRvIHVzZSBnbG9iYWwgQXBwIE1vZGFsc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbi8qKlxyXG4gICAgR2VuZXJhdGVzIGEgdGV4dCBtZXNzYWdlLCB3aXRoIG5ld2xpbmVzIGlmIG5lZWRlZCwgZGVzY3JpYmluZyB0aGUgZXJyb3JcclxuICAgIG9iamVjdCBwYXNzZWQuXHJcbiAgICBAcGFyYW0gZXJyOmFueSBBcyBhIHN0cmluZywgaXMgcmV0dXJuZWQgJ2FzIGlzJzsgYXMgZmFsc3ksIGl0IHJldHVybiBhIGdlbmVyaWNcclxuICAgIG1lc3NhZ2UgZm9yICd1bmtub3cgZXJyb3InOyBhcyBvYmplY3QsIGl0IGludmVzdGlnYXRlIHdoYXQgdHlwZSBvZiBlcnJvciBpcyB0b1xyXG4gICAgcHJvdmlkZSB0aGUgbW9yZSBtZWFuaW5mdWwgcmVzdWx0LCB3aXRoIGZhbGxiYWNrIHRvIEpTT04uc3RyaW5naWZ5IHByZWZpeGVkXHJcbiAgICB3aXRoICdUZWNobmljYWwgZGV0YWlsczonLlxyXG4gICAgT2JqZWN0cyByZWNvZ25pemVkOlxyXG4gICAgLSBYSFIvalF1ZXJ5IGZvciBKU09OIHJlc3BvbnNlczoganVzdCBvYmplY3RzIHdpdGggcmVzcG9uc2VKU09OIHByb3BlcnR5LCBpc1xyXG4gICAgICB1c2VkIGFzIHRoZSAnZXJyJyBvYmplY3QgYW5kIHBhc3NlZCB0byB0aGUgb3RoZXIgb2JqZWN0IHRlc3RzLlxyXG4gICAgLSBPYmplY3Qgd2l0aCAnZXJyb3JNZXNzYWdlJyAoc2VydmVyLXNpZGUgZm9ybWF0dGVkIGVycm9yKS5cclxuICAgIC0gT2JqZWN0IHdpdGggJ21lc3NhZ2UnIHByb3BlcnR5LCBsaWtlIHRoZSBzdGFuZGFyZCBFcnJvciBjbGFzcyBhbmQgRXhjZXB0aW9uIG9iamVjdHMuXHJcbiAgICAtIE9iamVjdCB3aXRoICduYW1lJyBwcm9wZXJ0eSwgbGlrZSB0aGUgc3RhbmRhcmQgRXhjZXB0aW9uIG9iamVjdHMuIFRoZSBuYW1lLCBpZiBhbnksXHJcbiAgICAgIGlzIHNldCBhcyBwcmVmaXggZm9yIHRoZSAnbWVzc2FnZScgcHJvcGVydHkgdmFsdWUuXHJcbiAgICAtIE9iamVjdCB3aXRoICdlcnJvcnMnIHByb3BlcnR5LiBFYWNoIGVsZW1lbnQgaW4gdGhlIGFycmF5IG9yIG9iamVjdCBvd24ga2V5c1xyXG4gICAgICBpcyBhcHBlbmRlZCB0byB0aGUgZXJyb3JNZXNzYWdlIG9yIG1lc3NhZ2Ugc2VwYXJhdGVkIGJ5IG5ld2xpbmUuXHJcbioqL1xyXG5leHBvcnRzLmdldEVycm9yTWVzc2FnZUZyb20gPSBmdW5jdGlvbiBnZXRFcnJvck1lc3NhZ2VGcm9tKGVycikge1xyXG4gICAgLypqc2hpbnQgbWF4Y29tcGxleGl0eToxMCovXHJcblxyXG4gICAgaWYgKCFlcnIpIHtcclxuICAgICAgICByZXR1cm4gJ1Vua25vdyBlcnJvcic7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YoZXJyKSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICByZXR1cm4gZXJyO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgLy8gSWYgaXMgYSBYSFIgb2JqZWN0LCB1c2UgaXRzIHJlc3BvbnNlIGFzIHRoZSBlcnJvci5cclxuICAgICAgICBlcnIgPSBlcnIucmVzcG9uc2VKU09OIHx8IGVycjtcclxuXHJcbiAgICAgICAgdmFyIG1zZyA9IGVyci5uYW1lICYmIChlcnIubmFtZSArICc6ICcpIHx8ICcnO1xyXG4gICAgICAgIG1zZyArPSBlcnIuZXJyb3JNZXNzYWdlIHx8IGVyci5tZXNzYWdlIHx8ICcnO1xyXG5cclxuICAgICAgICBpZiAoZXJyLmVycm9ycykge1xyXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShlcnIuZXJyb3JzKSkge1xyXG4gICAgICAgICAgICAgICAgbXNnICs9ICdcXG4nICsgZXJyLmVycm9ycy5qb2luKCdcXG4nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGVyci5lcnJvcnMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbXNnICs9ICdcXG4nICsgZXJyLmVycm9yc1trZXldLmpvaW4oJ1xcbicpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIG1zZyArPSAnXFxuVGVjaG5pY2FsIGRldGFpbHM6ICcgKyBKU09OLnN0cmluZ2lmeShlcnIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG1zZztcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydHMuc2hvd0Vycm9yID0gZnVuY3Rpb24gc2hvd0Vycm9yTW9kYWwob3B0aW9ucykge1xyXG4gICAgXHJcbiAgICB2YXIgbW9kYWwgPSAkKCcjZXJyb3JNb2RhbCcpLFxyXG4gICAgICAgIGhlYWRlciA9IG1vZGFsLmZpbmQoJyNlcnJvck1vZGFsLWxhYmVsJyksXHJcbiAgICAgICAgYm9keSA9IG1vZGFsLmZpbmQoJyNlcnJvck1vZGFsLWJvZHknKTtcclxuICAgIFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICBcclxuICAgIHZhciBtc2cgPSBib2R5LmRhdGEoJ2RlZmF1bHQtdGV4dCcpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLmVycm9yKVxyXG4gICAgICAgIG1zZyA9IGV4cG9ydHMuZ2V0RXJyb3JNZXNzYWdlRnJvbShvcHRpb25zLmVycm9yKTtcclxuICAgIGVsc2UgaWYgKG9wdGlvbnMubWVzc2FnZSlcclxuICAgICAgICBtc2cgPSBvcHRpb25zLm1lc3NhZ2U7XHJcblxyXG4gICAgYm9keS5tdWx0aWxpbmUobXNnKTtcclxuXHJcbiAgICBoZWFkZXIudGV4dChvcHRpb25zLnRpdGxlIHx8IGhlYWRlci5kYXRhKCdkZWZhdWx0LXRleHQnKSk7XHJcbiAgICBcclxuICAgIG1vZGFsLm1vZGFsKCdzaG93Jyk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgU2V0dXAgb2YgdGhlIHNoZWxsIG9iamVjdCB1c2VkIGJ5IHRoZSBhcHBcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBiYXNlVXJsID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xyXG5cclxuLy92YXIgSGlzdG9yeSA9IHJlcXVpcmUoJy4vYXBwLXNoZWxsLWhpc3RvcnknKS5jcmVhdGUoYmFzZVVybCk7XHJcbnZhciBIaXN0b3J5ID0gcmVxdWlyZSgnLi91dGlscy9zaGVsbC9oYXNoYmFuZ0hpc3RvcnknKTtcclxuXHJcbi8vIFNoZWxsIGRlcGVuZGVuY2llc1xyXG52YXIgc2hlbGwgPSByZXF1aXJlKCcuL3V0aWxzL3NoZWxsL2luZGV4JyksXHJcbiAgICBTaGVsbCA9IHNoZWxsLlNoZWxsLFxyXG4gICAgRG9tSXRlbXNNYW5hZ2VyID0gc2hlbGwuRG9tSXRlbXNNYW5hZ2VyO1xyXG5cclxudmFyIGlPUyA9IC8oaVBhZHxpUGhvbmV8aVBvZCkvZy50ZXN0KCBuYXZpZ2F0b3IudXNlckFnZW50ICk7XHJcblxyXG4vLyBDcmVhdGluZyB0aGUgc2hlbGw6XHJcbnZhciBzaGVsbCA9IG5ldyBTaGVsbCh7XHJcblxyXG4gICAgLy8gU2VsZWN0b3IsIERPTSBlbGVtZW50IG9yIGpRdWVyeSBvYmplY3QgcG9pbnRpbmdcclxuICAgIC8vIHRoZSByb290IG9yIGNvbnRhaW5lciBmb3IgdGhlIHNoZWxsIGl0ZW1zXHJcbiAgICByb290OiAnYm9keScsXHJcblxyXG4gICAgLy8gSWYgaXMgbm90IGluIHRoZSBzaXRlIHJvb3QsIHRoZSBiYXNlIFVSTCBpcyByZXF1aXJlZDpcclxuICAgIGJhc2VVcmw6IGJhc2VVcmwsXHJcbiAgICBcclxuICAgIGZvcmNlSGFzaGJhbmc6IHRydWUsXHJcblxyXG4gICAgaW5kZXhOYW1lOiAnaW5kZXgnLFxyXG5cclxuICAgIC8vIFdPUktBUk9VTkQ6IFVzaW5nIHRoZSAndGFwJyBldmVudCBmb3IgZmFzdGVyIG1vYmlsZSBleHBlcmllbmNlXHJcbiAgICAvLyAoZnJvbSBqcXVlcnktbW9iaWxlIGV2ZW50KSBvbiBpT1MgZGV2aWNlcywgYnV0IGxlZnRcclxuICAgIC8vICdjbGljaycgb24gb3RoZXJzIHNpbmNlIHRoZXkgaGFzIG5vdCB0aGUgc2xvdy1jbGljayBwcm9ibGVtXHJcbiAgICAvLyB0aGFua3MgdG8gdGhlIG1ldGEtdmlld3BvcnQuXHJcbiAgICAvLyBXT1JLQVJPVU5EOiBJTVBPUlRBTlQsIHVzaW5nICdjbGljaycgcmF0aGVyIHRoYW4gJ3RhcCcgb24gQW5kcm9pZFxyXG4gICAgLy8gcHJldmVudHMgYW4gYXBwIGNyYXNoIChvciBnbyBvdXQgYW5kIHBhZ2Ugbm90IGZvdW5kIG9uIENocm9tZSBmb3IgQW5kcm9pZClcclxuICAgIC8vIGJlY2F1c2Ugb2Ygc29tZSAnY2xpY2tzJyBoYXBwZW5pbmcgb25cclxuICAgIC8vIGEgaGFsZi1saW5rLWVsZW1lbnQgdGFwLCB3aGVyZSB0aGUgJ3RhcCcgZXZlbnQgZGV0ZWN0cyBhcyB0YXJnZXQgdGhlIG5vbi1saW5rIGFuZCB0aGVcclxuICAgIC8vIGxpbmsgZ2V0cyBleGVjdXRlZCBhbnl3YXkgYnkgdGhlIGJyb3dzZXIsIG5vdCBjYXRjaGVkIHNvIFdlYnZpZXcgbW92ZXMgdG8gXHJcbiAgICAvLyBhIG5vbiBleGlzdGFudCBmaWxlIChhbmQgdGhhdHMgbWFrZSBQaG9uZUdhcCB0byBjcmFzaCkuXHJcbiAgICBsaW5rRXZlbnQ6IGlPUyA/ICd0YXAnIDogJ2NsaWNrJyxcclxuXHJcbiAgICAvLyBObyBuZWVkIGZvciBsb2FkZXIsIGV2ZXJ5dGhpbmcgY29tZXMgYnVuZGxlZFxyXG4gICAgbG9hZGVyOiBudWxsLFxyXG5cclxuICAgIC8vIEhpc3RvcnkgUG9seWZpbGw6XHJcbiAgICBoaXN0b3J5OiBIaXN0b3J5LFxyXG5cclxuICAgIC8vIEEgRG9tSXRlbXNNYW5hZ2VyIG9yIGVxdWl2YWxlbnQgb2JqZWN0IGluc3RhbmNlIG5lZWRzIHRvXHJcbiAgICAvLyBiZSBwcm92aWRlZDpcclxuICAgIGRvbUl0ZW1zTWFuYWdlcjogbmV3IERvbUl0ZW1zTWFuYWdlcih7XHJcbiAgICAgICAgaWRBdHRyaWJ1dGVOYW1lOiAnZGF0YS1hY3Rpdml0eSdcclxuICAgIH0pXHJcbn0pO1xyXG5cclxuLy8gQ2F0Y2ggZXJyb3JzIG9uIGl0ZW0vcGFnZSBsb2FkaW5nLCBzaG93aW5nLi5cclxuc2hlbGwub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyKSB7XHJcbiAgICBcclxuICAgIHZhciBzdHIgPSAnVW5rbm93IGVycm9yJztcclxuICAgIGlmIChlcnIpIHtcclxuICAgICAgICBpZiAodHlwZW9mKGVycikgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHN0ciA9IGVycjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoZXJyLm1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgc3RyID0gZXJyLm1lc3NhZ2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBzdHIgPSBKU09OLnN0cmluZ2lmeShlcnIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBUT0RPIGNoYW5nZSB3aXRoIGEgZGlhbG9nIG9yIHNvbWV0aGluZ1xyXG4gICAgd2luZG93LmFsZXJ0KHN0cik7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzaGVsbDtcclxuIiwiLyoqXHJcbiAgICBBY3Rpdml0eSBiYXNlIGNsYXNzXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKSxcclxuICAgIE5hdkJhciA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QmFyJyk7XHJcblxyXG5yZXF1aXJlKCcuLi91dGlscy9GdW5jdGlvbi5wcm90b3R5cGUuX2luaGVyaXRzJyk7XHJcblxyXG4vKipcclxuICAgIEFjdGl2aXR5IGNsYXNzIGRlZmluaXRpb25cclxuKiovXHJcbmZ1bmN0aW9uIEFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuXHJcbiAgICAvLyBEZWZhdWx0IGFjY2VzcyBsZXZlbDogYW55b25lXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLk5vbmU7XHJcbiAgICBcclxuICAgIC8vIFRPRE86IEZ1dHVyZSB1c2Ugb2YgYSB2aWV3U3RhdGUsIHBsYWluIG9iamVjdCByZXByZXNlbnRhdGlvblxyXG4gICAgLy8gb2YgcGFydCBvZiB0aGUgdmlld01vZGVsIHRvIGJlIHVzZWQgYXMgdGhlIHN0YXRlIHBhc3NlZCB0byB0aGVcclxuICAgIC8vIGhpc3RvcnkgYW5kIGJldHdlZW4gYWN0aXZpdGllcyBjYWxscy5cclxuICAgIHRoaXMudmlld1N0YXRlID0ge307XHJcbiAgICBcclxuICAgIC8vIE9iamVjdCB0byBob2xkIHRoZSBvcHRpb25zIHBhc3NlZCBvbiAnc2hvdycgYXMgYSByZXN1bHRcclxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcclxuICAgIHRoaXMucmVxdWVzdERhdGEgPSBudWxsO1xyXG5cclxuICAgIC8vIERlZmF1bHQgbmF2QmFyIG9iamVjdC5cclxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XHJcbiAgICAgICAgdGl0bGU6IG51bGwsIC8vIG51bGwgZm9yIGxvZ29cclxuICAgICAgICBsZWZ0QWN0aW9uOiBudWxsLFxyXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBudWxsXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gRGVsYXllZCBiaW5kaW5ncyB0byBhbGxvdyBmb3IgZnVydGhlciBjb25zdHJ1Y3RvciBzZXQtdXAgXHJcbiAgICAvLyBvbiBzdWJjbGFzc2VzLlxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiBBY3Rpdml0eUNvbnN0cnVjdG9yRGVsYXllZCgpIHtcclxuICAgICAgICAvLyBBIHZpZXcgbW9kZWwgYW5kIGJpbmRpbmdzIGJlaW5nIGFwcGxpZWQgaXMgZXZlciByZXF1aXJlZFxyXG4gICAgICAgIC8vIGV2ZW4gb24gQWN0aXZpdGllcyB3aXRob3V0IG5lZWQgZm9yIGEgdmlldyBtb2RlbCwgc2luY2VcclxuICAgICAgICAvLyB0aGUgdXNlIG9mIGNvbXBvbmVudHMgYW5kIHRlbXBsYXRlcywgb3IgYW55IG90aGVyIGRhdGEtYmluZFxyXG4gICAgICAgIC8vIHN5bnRheCwgcmVxdWlyZXMgdG8gYmUgaW4gYSBjb250ZXh0IHdpdGggYmluZGluZyBlbmFibGVkOlxyXG4gICAgICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy52aWV3TW9kZWwgfHwge30sICRhY3Rpdml0eS5nZXQoMCkpO1xyXG4gICAgfS5iaW5kKHRoaXMpLCAxKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBY3Rpdml0eTtcclxuXHJcbi8qKlxyXG4gICAgU2V0LXVwIHZpc3VhbGl6YXRpb24gb2YgdGhlIHZpZXcgd2l0aCB0aGUgZ2l2ZW4gb3B0aW9ucy9zdGF0ZSxcclxuICAgIHdpdGggYSByZXNldCBvZiBjdXJyZW50IHN0YXRlLlxyXG4gICAgTXVzdCBiZSBleGVjdXRlZCBldmVyeSB0aW1lIHRoZSBhY3Rpdml0eSBpcyBwdXQgaW4gdGhlIGN1cnJlbnQgdmlldy5cclxuKiovXHJcbkFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcbiAgICAvLyBUT0RPOiBtdXN0IGtlZXAgdmlld1N0YXRlIHVwIHRvIGRhdGUgdXNpbmcgb3B0aW9ucy9zdGF0ZS5cclxuICAgIFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICB0aGlzLnJlcXVlc3REYXRhID0gb3B0aW9ucztcclxuICAgIFxyXG4gICAgLy8gRW5hYmxlIHJlZ2lzdGVyZWQgaGFuZGxlcnNcclxuICAgIC8vIFZhbGlkYXRpb24gb2YgZWFjaCBzZXR0aW5ncyBvYmplY3QgaXMgcGVyZm9ybWVkXHJcbiAgICAvLyBvbiByZWdpc3RlcmVkLCBhdm9pZGVkIGhlcmUuXHJcbiAgICBpZiAodGhpcy5faGFuZGxlcnMgJiZcclxuICAgICAgICB0aGlzLl9oYW5kbGVyc0FyZUNvbm5lY3RlZCAhPT0gdHJ1ZSkge1xyXG4gICAgICAgIHRoaXMuX2hhbmRsZXJzLmZvckVhY2goZnVuY3Rpb24oc2V0dGluZ3MpIHtcclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgaXMgYW4gb2JzZXJ2YWJsZSBzdWJzY3JpcHRpb25cclxuICAgICAgICAgICAgaWYgKCFzZXR0aW5ncy5ldmVudCAmJiBzZXR0aW5ncy50YXJnZXQuc3Vic2NyaWJlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3Vic2NyaXB0aW9uID0gc2V0dGluZ3MudGFyZ2V0LnN1YnNjcmliZShzZXR0aW5ncy5oYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgIC8vIE9ic2VydmFibGVzIGhhcyBub3QgYSAndW5zdWJzY3JpYmUnIGZ1bmN0aW9uLFxyXG4gICAgICAgICAgICAgICAgLy8gdGhleSByZXR1cm4gYW4gb2JqZWN0IHRoYXQgbXVzdCBiZSAnZGlzcG9zZWQnLlxyXG4gICAgICAgICAgICAgICAgLy8gU2F2aW5nIHRoYXQgd2l0aCBzZXR0aW5ncyB0byBhbGxvdyAndW5zdWJzY3JpYmUnIGxhdGVyLlxyXG4gICAgICAgICAgICAgICAgc2V0dGluZ3MuX3N1YnNjcmlwdGlvbiA9IHN1YnNjcmlwdGlvbjtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBJbm1lZGlhdGUgZXhlY3V0aW9uOiBpZiBjdXJyZW50IG9ic2VydmFibGUgdmFsdWUgaXMgZGlmZmVyZW50XHJcbiAgICAgICAgICAgICAgICAvLyB0aGFuIHByZXZpb3VzIG9uZSwgZXhlY3V0ZSB0aGUgaGFuZGxlcjpcclxuICAgICAgICAgICAgICAgIC8vICh0aGlzIGF2b2lkIHRoYXQgYSBjaGFuZ2VkIHN0YXRlIGdldCBvbWl0dGVkIGJlY2F1c2UgaGFwcGVuZWRcclxuICAgICAgICAgICAgICAgIC8vIHdoZW4gc3Vic2NyaXB0aW9uIHdhcyBvZmY7IGl0IG1lYW5zIGEgZmlyc3QgdGltZSBleGVjdXRpb24gdG9vKS5cclxuICAgICAgICAgICAgICAgIC8vIE5PVEU6ICd1bmRlZmluZWQnIHZhbHVlIG9uIG9ic2VydmFibGUgbWF5IGNhdXNlIHRoaXMgdG8gZmFsbFxyXG4gICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzLl9sYXRlc3RTdWJzY3JpYmVkVmFsdWUgIT09IHNldHRpbmdzLnRhcmdldCgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0dGluZ3MuaGFuZGxlci5jYWxsKHNldHRpbmdzLnRhcmdldCwgc2V0dGluZ3MudGFyZ2V0KCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHNldHRpbmdzLnNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy50YXJnZXQub24oc2V0dGluZ3MuZXZlbnQsIHNldHRpbmdzLnNlbGVjdG9yLCBzZXR0aW5ncy5oYW5kbGVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHNldHRpbmdzLnRhcmdldC5vbihzZXR0aW5ncy5ldmVudCwgc2V0dGluZ3MuaGFuZGxlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBUbyBhdm9pZCBkb3VibGUgY29ubmVjdGlvbnM6XHJcbiAgICAgICAgLy8gTk9URTogbWF5IGhhcHBlbiB0aGF0ICdzaG93JyBnZXRzIGNhbGxlZCBzZXZlcmFsIHRpbWVzIHdpdGhvdXQgYSAnaGlkZSdcclxuICAgICAgICAvLyBpbiBiZXR3ZWVuLCBiZWNhdXNlICdzaG93JyBhY3RzIGFzIGEgcmVmcmVzaGVyIHJpZ2h0IG5vdyBldmVuIGZyb20gc2VnbWVudFxyXG4gICAgICAgIC8vIGNoYW5nZXMgZnJvbSB0aGUgc2FtZSBhY3Rpdml0eS5cclxuICAgICAgICB0aGlzLl9oYW5kbGVyc0FyZUNvbm5lY3RlZCA9IHRydWU7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICAgIFBlcmZvcm0gdGFza3MgdG8gc3RvcCBhbnl0aGluZyBydW5uaW5nIG9yIHN0b3AgaGFuZGxlcnMgZnJvbSBsaXN0ZW5pbmcuXHJcbiAgICBNdXN0IGJlIGV4ZWN1dGVkIGV2ZXJ5IHRpbWUgdGhlIGFjdGl2aXR5IGlzIGhpZGRlbi9yZW1vdmVkIFxyXG4gICAgZnJvbSB0aGUgY3VycmVudCB2aWV3LlxyXG4qKi9cclxuQWN0aXZpdHkucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbiBoaWRlKCkge1xyXG4gICAgXHJcbiAgICAvLyBEaXNhYmxlIHJlZ2lzdGVyZWQgaGFuZGxlcnNcclxuICAgIGlmICh0aGlzLl9oYW5kbGVycykge1xyXG4gICAgICAgIHRoaXMuX2hhbmRsZXJzLmZvckVhY2goZnVuY3Rpb24oc2V0dGluZ3MpIHtcclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgaXMgYW4gb2JzZXJ2YWJsZSBzdWJzY3JpcHRpb25cclxuICAgICAgICAgICAgaWYgKHNldHRpbmdzLl9zdWJzY3JpcHRpb24pIHtcclxuICAgICAgICAgICAgICAgIHNldHRpbmdzLl9zdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgLy8gU2F2ZSBsYXRlc3Qgb2JzZXJ2YWJsZSB2YWx1ZSB0byBtYWtlIGEgY29tcGFyaXNpb25cclxuICAgICAgICAgICAgICAgIC8vIG5leHQgdGltZSBpcyBlbmFibGVkIHRvIGVuc3VyZSBpcyBleGVjdXRlZCBpZiB0aGVyZSB3YXNcclxuICAgICAgICAgICAgICAgIC8vIGEgY2hhbmdlIHdoaWxlIGRpc2FibGVkOlxyXG4gICAgICAgICAgICAgICAgc2V0dGluZ3MuX2xhdGVzdFN1YnNjcmliZWRWYWx1ZSA9IHNldHRpbmdzLnRhcmdldCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHNldHRpbmdzLnRhcmdldC5vZmYpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzZXR0aW5ncy5zZWxlY3RvcilcclxuICAgICAgICAgICAgICAgICAgICBzZXR0aW5ncy50YXJnZXQub2ZmKHNldHRpbmdzLmV2ZW50LCBzZXR0aW5ncy5zZWxlY3Rvciwgc2V0dGluZ3MuaGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgc2V0dGluZ3MudGFyZ2V0Lm9mZihzZXR0aW5ncy5ldmVudCwgc2V0dGluZ3MuaGFuZGxlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy50YXJnZXQucmVtb3ZlTGlzdGVuZXIoc2V0dGluZ3MuZXZlbnQsIHNldHRpbmdzLmhhbmRsZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5faGFuZGxlcnNBcmVDb25uZWN0ZWQgPSBmYWxzZTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gICAgUmVnaXN0ZXIgYSBoYW5kbGVyIHRoYXQgYWN0cyBvbiBhbiBldmVudCBvciBzdWJzY3JpcHRpb24gbm90aWZpY2F0aW9uLFxyXG4gICAgdGhhdCB3aWxsIGJlIGVuYWJsZWQgb24gQWN0aXZpdHkuc2hvdyBhbmQgZGlzYWJsZWQgb24gQWN0aXZpdHkuaGlkZS5cclxuXHJcbiAgICBAcGFyYW0gc2V0dGluZ3M6b2JqZWN0IHtcclxuICAgICAgICB0YXJnZXQ6IGpRdWVyeSwgRXZlbnRFbWl0dGVyLCBLbm9ja291dC5vYnNlcnZhYmxlLiBSZXF1aXJlZFxyXG4gICAgICAgIGV2ZW50OiBzdHJpbmcuIEV2ZW50IG5hbWUgKGNhbiBoYXZlIG5hbWVzcGFjZXMsIHNldmVyYWwgZXZlbnRzIGFsbG93ZWQpLiBJdHMgcmVxdWlyZWQgZXhjZXB0IHdoZW4gdGhlIHRhcmdldCBpcyBhbiBvYnNlcnZhYmxlLCB0aGVyZSBtdXN0XHJcbiAgICAgICAgICAgIGJlIG9taXR0ZWQuXHJcbiAgICAgICAgaGFuZGxlcjogRnVuY3Rpb24uIFJlcXVpcmVkLFxyXG4gICAgICAgIHNlbGVjdG9yOiBzdHJpbmcuIE9wdGlvbmFsLiBGb3IgalF1ZXJ5IGV2ZW50cyBvbmx5LCBwYXNzZWQgYXMgdGhlXHJcbiAgICAgICAgICAgIHNlbGVjdG9yIGZvciBkZWxlZ2F0ZWQgaGFuZGxlcnMuXHJcbiAgICB9XHJcbioqL1xyXG5BY3Rpdml0eS5wcm90b3R5cGUucmVnaXN0ZXJIYW5kbGVyID0gZnVuY3Rpb24gcmVnaXN0ZXJIYW5kbGVyKHNldHRpbmdzKSB7XHJcbiAgICAvKmpzaGludCBtYXhjb21wbGV4aXR5OjggKi9cclxuICAgIFxyXG4gICAgaWYgKCFzZXR0aW5ncylcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlZ2lzdGVyIHJlcXVpcmUgYSBzZXR0aW5ncyBvYmplY3QnKTtcclxuICAgIFxyXG4gICAgaWYgKCFzZXR0aW5ncy50YXJnZXQgfHwgKCFzZXR0aW5ncy50YXJnZXQub24gJiYgIXNldHRpbmdzLnRhcmdldC5zdWJzY3JpYmUpKVxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGFyZ2V0IGlzIG51bGwgb3Igbm90IGEgalF1ZXJ5LCBFdmVudEVtbWl0ZXIgb3IgT2JzZXJ2YWJsZSBvYmplY3QnKTtcclxuICAgIFxyXG4gICAgaWYgKHR5cGVvZihzZXR0aW5ncy5oYW5kbGVyKSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSGFuZGxlciBtdXN0IGJlIGEgZnVuY3Rpb24uJyk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGlmICghc2V0dGluZ3MuZXZlbnQgJiYgIXNldHRpbmdzLnRhcmdldC5zdWJzY3JpYmUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V2ZW50IGlzIG51bGw7IGl0XFwncyByZXF1aXJlZCBmb3Igbm9uIG9ic2VydmFibGUgb2JqZWN0cycpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2hhbmRsZXJzID0gdGhpcy5faGFuZGxlcnMgfHwgW107XHJcblxyXG4gICAgdGhpcy5faGFuZGxlcnMucHVzaChzZXR0aW5ncyk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIFN0YXRpYyB1dGlsaXRpZXNcclxuKiovXHJcbi8vIEZvciBjb21tb2RpdHksIGNvbW1vbiBjbGFzc2VzIGFyZSBleHBvc2VkIGFzIHN0YXRpYyBwcm9wZXJ0aWVzXHJcbkFjdGl2aXR5Lk5hdkJhciA9IE5hdkJhcjtcclxuQWN0aXZpdHkuTmF2QWN0aW9uID0gTmF2QWN0aW9uO1xyXG5cclxuLy8gUXVpY2sgY3JlYXRpb24gb2YgY29tbW9uIHR5cGVzIG9mIE5hdkJhclxyXG5BY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyID0gZnVuY3Rpb24gY3JlYXRlU2VjdGlvbk5hdkJhcih0aXRsZSkge1xyXG4gICAgcmV0dXJuIG5ldyBOYXZCYXIoe1xyXG4gICAgICAgIHRpdGxlOiB0aXRsZSxcclxuICAgICAgICBsZWZ0QWN0aW9uOiBOYXZBY3Rpb24ubWVudU5ld0l0ZW0sXHJcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5tZW51SW5cclxuICAgIH0pO1xyXG59O1xyXG5cclxuQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhciA9IGZ1bmN0aW9uIGNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIodGl0bGUsIG9wdGlvbnMpIHtcclxuICAgIFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICBcclxuICAgIHZhciBnb0JhY2tPcHRpb25zID0ge1xyXG4gICAgICAgIHRleHQ6IHRpdGxlLFxyXG4gICAgICAgIGlzVGl0bGU6IHRydWVcclxuICAgIH07XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuYmFja0xpbmspIHtcclxuICAgICAgICBnb0JhY2tPcHRpb25zLmxpbmsgPSBvcHRpb25zLmJhY2tMaW5rO1xyXG4gICAgICAgIGdvQmFja09wdGlvbnMuaXNTaGVsbCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgTmF2QmFyKHtcclxuICAgICAgICB0aXRsZTogJycsIC8vIE5vIHRpdGxlXHJcbiAgICAgICAgbGVmdEFjdGlvbjogTmF2QWN0aW9uLmdvQmFjay5tb2RlbC5jbG9uZShnb0JhY2tPcHRpb25zKSxcclxuICAgICAgICByaWdodEFjdGlvbjogb3B0aW9ucy5oZWxwSWQgP1xyXG4gICAgICAgICAgICBOYXZBY3Rpb24uZ29IZWxwSW5kZXgubW9kZWwuY2xvbmUoe1xyXG4gICAgICAgICAgICAgICAgbGluazogJyMnICsgb3B0aW9ucy5oZWxwSWRcclxuICAgICAgICAgICAgfSkgOlxyXG4gICAgICAgICAgICBOYXZBY3Rpb24uZ29IZWxwSW5kZXhcclxuICAgIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBTaW5nbGV0b24gaGVscGVyXHJcbioqL1xyXG52YXIgY3JlYXRlU2luZ2xldG9uID0gZnVuY3Rpb24gY3JlYXRlU2luZ2xldG9uKEFjdGl2aXR5Q2xhc3MsICRhY3Rpdml0eSwgYXBwKSB7XHJcbiAgICBcclxuICAgIGNyZWF0ZVNpbmdsZXRvbi5pbnN0YW5jZXMgPSBjcmVhdGVTaW5nbGV0b24uaW5zdGFuY2VzIHx8IHt9O1xyXG4gICAgXHJcbiAgICBpZiAoY3JlYXRlU2luZ2xldG9uLmluc3RhbmNlc1tBY3Rpdml0eUNsYXNzLm5hbWVdIGluc3RhbmNlb2YgQWN0aXZpdHlDbGFzcykge1xyXG4gICAgICAgIHJldHVybiBjcmVhdGVTaW5nbGV0b24uaW5zdGFuY2VzW0FjdGl2aXR5Q2xhc3MubmFtZV07XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICB2YXIgcyA9IG5ldyBBY3Rpdml0eUNsYXNzKCRhY3Rpdml0eSwgYXBwKTtcclxuICAgICAgICBjcmVhdGVTaW5nbGV0b24uaW5zdGFuY2VzW0FjdGl2aXR5Q2xhc3MubmFtZV0gPSBzO1xyXG4gICAgICAgIHJldHVybiBzO1xyXG4gICAgfVxyXG59O1xyXG4vLyBFeGFtcGxlIG9mIHVzZVxyXG4vL2V4cG9ydHMuaW5pdCA9IGNyZWF0ZVNpbmdsZXRvbi5iaW5kKG51bGwsIEFjdGl2aXR5Q2xhc3MpO1xyXG5cclxuLyoqXHJcbiAgICBTdGF0aWMgbWV0aG9kIGV4dGVuZHMgdG8gaGVscCBpbmhlcml0YW5jZS5cclxuICAgIEFkZGl0aW9uYWxseSwgaXQgYWRkcyBhIHN0YXRpYyBpbml0IG1ldGhvZCByZWFkeSBmb3IgdGhlIG5ldyBjbGFzc1xyXG4gICAgdGhhdCBnZW5lcmF0ZXMvcmV0cmlldmVzIHRoZSBzaW5nbGV0b24uXHJcbioqL1xyXG5BY3Rpdml0eS5leHRlbmRzID0gZnVuY3Rpb24gZXh0ZW5kc0FjdGl2aXR5KENsYXNzRm4pIHtcclxuICAgIFxyXG4gICAgQ2xhc3NGbi5faW5oZXJpdHMoQWN0aXZpdHkpO1xyXG4gICAgXHJcbiAgICBDbGFzc0ZuLmluaXQgPSBjcmVhdGVTaW5nbGV0b24uYmluZChudWxsLCBDbGFzc0ZuKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIENsYXNzRm47XHJcbn07XHJcbiIsIi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gKiBEYXRlUGlja2VyIEpTIENvbXBvbmVudCwgd2l0aCBzZXZlcmFsXHJcbiAqIG1vZGVzIGFuZCBvcHRpb25hbCBpbmxpbmUtcGVybWFuZW50IHZpc3VhbGl6YXRpb24uXHJcbiAqXHJcbiAqIENvcHlyaWdodCAyMDE0IExvY29ub21pY3MgQ29vcC5cclxuICpcclxuICogQmFzZWQgb246XHJcbiAqIGJvb3RzdHJhcC1kYXRlcGlja2VyLmpzIFxyXG4gKiBodHRwOi8vd3d3LmV5ZWNvbi5yby9ib290c3RyYXAtZGF0ZXBpY2tlclxyXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICogQ29weXJpZ2h0IDIwMTIgU3RlZmFuIFBldHJlXHJcbiAqXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XHJcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cclxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XHJcbiAqXHJcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxyXG4gKlxyXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXHJcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcclxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXHJcbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcclxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXHJcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTsgXHJcblxyXG52YXIgY2xhc3NlcyA9IHtcclxuICAgIGNvbXBvbmVudDogJ0RhdGVQaWNrZXInLFxyXG4gICAgbW9udGhzOiAnRGF0ZVBpY2tlci1tb250aHMnLFxyXG4gICAgZGF5czogJ0RhdGVQaWNrZXItZGF5cycsXHJcbiAgICBtb250aERheTogJ2RheScsXHJcbiAgICBtb250aDogJ21vbnRoJyxcclxuICAgIHllYXI6ICd5ZWFyJyxcclxuICAgIHllYXJzOiAnRGF0ZVBpY2tlci15ZWFycydcclxufTtcclxuXHJcbi8vIFBpY2tlciBvYmplY3RcclxudmFyIERhdGVQaWNrZXIgPSBmdW5jdGlvbihlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAvKmpzaGludCBtYXhzdGF0ZW1lbnRzOjMyLG1heGNvbXBsZXhpdHk6MjQqL1xyXG4gICAgdGhpcy5lbGVtZW50ID0gJChlbGVtZW50KTtcclxuICAgIHRoaXMuZm9ybWF0ID0gRFBHbG9iYWwucGFyc2VGb3JtYXQob3B0aW9ucy5mb3JtYXR8fHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLWZvcm1hdCcpfHwnbW0vZGQveXl5eScpO1xyXG4gICAgXHJcbiAgICB0aGlzLmlzSW5wdXQgPSB0aGlzLmVsZW1lbnQuaXMoJ2lucHV0Jyk7XHJcbiAgICB0aGlzLmNvbXBvbmVudCA9IHRoaXMuZWxlbWVudC5pcygnLmRhdGUnKSA/IHRoaXMuZWxlbWVudC5maW5kKCcuYWRkLW9uJykgOiBmYWxzZTtcclxuICAgIHRoaXMuaXNQbGFjZWhvbGRlciA9IHRoaXMuZWxlbWVudC5pcygnLmNhbGVuZGFyLXBsYWNlaG9sZGVyJyk7XHJcbiAgICBcclxuICAgIHRoaXMucGlja2VyID0gJChEUEdsb2JhbC50ZW1wbGF0ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZFRvKHRoaXMuaXNQbGFjZWhvbGRlciA/IHRoaXMuZWxlbWVudCA6ICdib2R5JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLm9uKCdjbGljayB0YXAnLCAkLnByb3h5KHRoaXMuY2xpY2ssIHRoaXMpKTtcclxuICAgIC8vIFRPRE86IHRvIHJldmlldyBpZiAnY29udGFpbmVyJyBjbGFzcyBjYW4gYmUgYXZvaWRlZCwgc28gaW4gcGxhY2Vob2xkZXIgbW9kZSBnZXRzIG9wdGlvbmFsXHJcbiAgICAvLyBpZiBpcyB3YW50ZWQgY2FuIGJlIHBsYWNlZCBvbiB0aGUgcGxhY2Vob2xkZXIgZWxlbWVudCAob3IgY29udGFpbmVyLWZsdWlkIG9yIG5vdGhpbmcpXHJcbiAgICB0aGlzLnBpY2tlci5hZGRDbGFzcyh0aGlzLmlzUGxhY2Vob2xkZXIgPyAnY29udGFpbmVyJyA6ICdkcm9wZG93bi1tZW51Jyk7XHJcbiAgICBcclxuICAgIGlmICh0aGlzLmlzUGxhY2Vob2xkZXIpIHtcclxuICAgICAgICB0aGlzLnBpY2tlci5zaG93KCk7XHJcbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlJykgPT0gJ3RvZGF5Jykge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdzaG93JyxcclxuICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0aGlzLmlzSW5wdXQpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnQub24oe1xyXG4gICAgICAgICAgICBmb2N1czogJC5wcm94eSh0aGlzLnNob3csIHRoaXMpLFxyXG4gICAgICAgICAgICAvL2JsdXI6ICQucHJveHkodGhpcy5oaWRlLCB0aGlzKSxcclxuICAgICAgICAgICAga2V5dXA6ICQucHJveHkodGhpcy51cGRhdGUsIHRoaXMpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmICh0aGlzLmNvbXBvbmVudCl7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcG9uZW50Lm9uKCdjbGljayB0YXAnLCAkLnByb3h5KHRoaXMuc2hvdywgdGhpcykpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5vbignY2xpY2sgdGFwJywgJC5wcm94eSh0aGlzLnNob3csIHRoaXMpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qIFRvdWNoIGV2ZW50cyB0byBzd2lwZSBkYXRlcyAqL1xyXG4gICAgdGhpcy5lbGVtZW50XHJcbiAgICAub24oJ3N3aXBlbGVmdCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdGhpcy5tb3ZlRGF0ZSgnbmV4dCcpO1xyXG4gICAgfS5iaW5kKHRoaXMpKVxyXG4gICAgLm9uKCdzd2lwZXJpZ2h0JywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB0aGlzLm1vdmVEYXRlKCdwcmV2Jyk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIC8qIFNldC11cCB2aWV3IG1vZGUgKi9cclxuICAgIHRoaXMubWluVmlld01vZGUgPSBvcHRpb25zLm1pblZpZXdNb2RlfHx0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS1taW52aWV3bW9kZScpfHwwO1xyXG4gICAgaWYgKHR5cGVvZiB0aGlzLm1pblZpZXdNb2RlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgIHN3aXRjaCAodGhpcy5taW5WaWV3TW9kZSkge1xyXG4gICAgICAgICAgICBjYXNlICdtb250aHMnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5WaWV3TW9kZSA9IDE7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAneWVhcnMnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5WaWV3TW9kZSA9IDI7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHRoaXMubWluVmlld01vZGUgPSAwO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy52aWV3TW9kZSA9IG9wdGlvbnMudmlld01vZGV8fHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLXZpZXdtb2RlJyl8fDA7XHJcbiAgICBpZiAodHlwZW9mIHRoaXMudmlld01vZGUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgc3dpdGNoICh0aGlzLnZpZXdNb2RlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ21vbnRocyc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlID0gMTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICd5ZWFycyc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlID0gMjtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZSA9IDA7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnN0YXJ0Vmlld01vZGUgPSB0aGlzLnZpZXdNb2RlO1xyXG4gICAgdGhpcy53ZWVrU3RhcnQgPSBvcHRpb25zLndlZWtTdGFydHx8dGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtd2Vla3N0YXJ0Jyl8fDA7XHJcbiAgICB0aGlzLndlZWtFbmQgPSB0aGlzLndlZWtTdGFydCA9PT0gMCA/IDYgOiB0aGlzLndlZWtTdGFydCAtIDE7XHJcbiAgICB0aGlzLm9uUmVuZGVyID0gb3B0aW9ucy5vblJlbmRlcjtcclxuICAgIHRoaXMuZmlsbERvdygpO1xyXG4gICAgdGhpcy5maWxsTW9udGhzKCk7XHJcbiAgICB0aGlzLnVwZGF0ZSgpO1xyXG4gICAgdGhpcy5zaG93TW9kZSgpO1xyXG59O1xyXG5cclxuRGF0ZVBpY2tlci5wcm90b3R5cGUgPSB7XHJcbiAgICBjb25zdHJ1Y3RvcjogRGF0ZVBpY2tlcixcclxuICAgIFxyXG4gICAgc2hvdzogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHRoaXMucGlja2VyLnNob3coKTtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMuY29tcG9uZW50ID8gdGhpcy5jb21wb25lbnQub3V0ZXJIZWlnaHQoKSA6IHRoaXMuZWxlbWVudC5vdXRlckhlaWdodCgpO1xyXG4gICAgICAgIHRoaXMucGxhY2UoKTtcclxuICAgICAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsICQucHJveHkodGhpcy5wbGFjZSwgdGhpcykpO1xyXG4gICAgICAgIGlmIChlICkge1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpcy5pc0lucHV0KSB7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICAkKGRvY3VtZW50KS5vbignbW91c2Vkb3duJywgZnVuY3Rpb24oZXYpe1xyXG4gICAgICAgICAgICBpZiAoJChldi50YXJnZXQpLmNsb3Nlc3QoJy4nICsgY2xhc3Nlcy5jb21wb25lbnQpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5oaWRlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdzaG93JyxcclxuICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBoaWRlOiBmdW5jdGlvbigpe1xyXG4gICAgICAgIHRoaXMucGlja2VyLmhpZGUoKTtcclxuICAgICAgICAkKHdpbmRvdykub2ZmKCdyZXNpemUnLCB0aGlzLnBsYWNlKTtcclxuICAgICAgICB0aGlzLnZpZXdNb2RlID0gdGhpcy5zdGFydFZpZXdNb2RlO1xyXG4gICAgICAgIHRoaXMuc2hvd01vZGUoKTtcclxuICAgICAgICBpZiAoIXRoaXMuaXNJbnB1dCkge1xyXG4gICAgICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ21vdXNlZG93bicsIHRoaXMuaGlkZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vdGhpcy5zZXQoKTtcclxuICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdoaWRlJyxcclxuICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBmb3JtYXRlZCA9IERQR2xvYmFsLmZvcm1hdERhdGUodGhpcy5kYXRlLCB0aGlzLmZvcm1hdCk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzSW5wdXQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY29tcG9uZW50KXtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5maW5kKCdpbnB1dCcpLnByb3AoJ3ZhbHVlJywgZm9ybWF0ZWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlJywgZm9ybWF0ZWQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wcm9wKCd2YWx1ZScsIGZvcm1hdGVkKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBTZXRzIGEgZGF0ZSBhcyB2YWx1ZSBhbmQgbm90aWZ5IHdpdGggYW4gZXZlbnQuXHJcbiAgICAgICAgUGFyYW1ldGVyIGRvbnROb3RpZnkgaXMgb25seSBmb3IgY2FzZXMgd2hlcmUgdGhlIGNhbGVuZGFyIG9yXHJcbiAgICAgICAgc29tZSByZWxhdGVkIGNvbXBvbmVudCBnZXRzIGFscmVhZHkgdXBkYXRlZCBidXQgdGhlIGhpZ2hsaWdodGVkXHJcbiAgICAgICAgZGF0ZSBuZWVkcyB0byBiZSB1cGRhdGVkIHdpdGhvdXQgY3JlYXRlIGluZmluaXRlIHJlY3Vyc2lvbiBcclxuICAgICAgICBiZWNhdXNlIG9mIG5vdGlmaWNhdGlvbi4gSW4gb3RoZXIgY2FzZSwgZG9udCB1c2UuXHJcbiAgICAqKi9cclxuICAgIHNldFZhbHVlOiBmdW5jdGlvbihuZXdEYXRlLCBkb250Tm90aWZ5KSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBuZXdEYXRlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGUgPSBEUEdsb2JhbC5wYXJzZURhdGUobmV3RGF0ZSwgdGhpcy5mb3JtYXQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSA9IG5ldyBEYXRlKG5ld0RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgICAgIHRoaXMudmlld0RhdGUgPSBuZXcgRGF0ZSh0aGlzLmRhdGUuZ2V0RnVsbFllYXIoKSwgdGhpcy5kYXRlLmdldE1vbnRoKCksIDEsIDAsIDAsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChkb250Tm90aWZ5ICE9PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIC8vIE5vdGlmeTpcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICAgICAgdmlld01vZGU6IERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZ2V0VmFsdWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGU7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBtb3ZlVmFsdWU6IGZ1bmN0aW9uKGRpciwgbW9kZSkge1xyXG4gICAgICAgIC8vIGRpciBjYW4gYmU6ICdwcmV2JywgJ25leHQnXHJcbiAgICAgICAgaWYgKFsncHJldicsICduZXh0J10uaW5kZXhPZihkaXIgJiYgZGlyLnRvTG93ZXJDYXNlKCkpID09IC0xKVxyXG4gICAgICAgICAgICAvLyBObyB2YWxpZCBvcHRpb246XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gZGVmYXVsdCBtb2RlIGlzIHRoZSBjdXJyZW50IG9uZVxyXG4gICAgICAgIG1vZGUgPSBtb2RlID9cclxuICAgICAgICAgICAgRFBHbG9iYWwubW9kZXNTZXRbbW9kZV0gOlxyXG4gICAgICAgICAgICBEUEdsb2JhbC5tb2Rlc1t0aGlzLnZpZXdNb2RlXTtcclxuXHJcbiAgICAgICAgdGhpcy5kYXRlWydzZXQnICsgbW9kZS5uYXZGbmNdLmNhbGwoXHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSxcclxuICAgICAgICAgICAgdGhpcy5kYXRlWydnZXQnICsgbW9kZS5uYXZGbmNdLmNhbGwodGhpcy5kYXRlKSArIFxyXG4gICAgICAgICAgICBtb2RlLm5hdlN0ZXAgKiAoZGlyID09PSAncHJldicgPyAtMSA6IDEpXHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLnNldFZhbHVlKHRoaXMuZGF0ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0ZTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIHBsYWNlOiBmdW5jdGlvbigpe1xyXG4gICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLmNvbXBvbmVudCA/IHRoaXMuY29tcG9uZW50Lm9mZnNldCgpIDogdGhpcy5lbGVtZW50Lm9mZnNldCgpO1xyXG4gICAgICAgIHRoaXMucGlja2VyLmNzcyh7XHJcbiAgICAgICAgICAgIHRvcDogb2Zmc2V0LnRvcCArIHRoaXMuaGVpZ2h0LFxyXG4gICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbihuZXdEYXRlKXtcclxuICAgICAgICB0aGlzLmRhdGUgPSBEUEdsb2JhbC5wYXJzZURhdGUoXHJcbiAgICAgICAgICAgIHR5cGVvZiBuZXdEYXRlID09PSAnc3RyaW5nJyA/IG5ld0RhdGUgOiAodGhpcy5pc0lucHV0ID8gdGhpcy5lbGVtZW50LnByb3AoJ3ZhbHVlJykgOiB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZScpKSxcclxuICAgICAgICAgICAgdGhpcy5mb3JtYXRcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMudmlld0RhdGUgPSBuZXcgRGF0ZSh0aGlzLmRhdGUuZ2V0RnVsbFllYXIoKSwgdGhpcy5kYXRlLmdldE1vbnRoKCksIDEsIDAsIDAsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZmlsbERvdzogZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgZG93Q250ID0gdGhpcy53ZWVrU3RhcnQ7XHJcbiAgICAgICAgdmFyIGh0bWwgPSAnPHRyPic7XHJcbiAgICAgICAgd2hpbGUgKGRvd0NudCA8IHRoaXMud2Vla1N0YXJ0ICsgNykge1xyXG4gICAgICAgICAgICBodG1sICs9ICc8dGggY2xhc3M9XCJkb3dcIj4nK0RQR2xvYmFsLmRhdGVzLmRheXNNaW5bKGRvd0NudCsrKSU3XSsnPC90aD4nO1xyXG4gICAgICAgIH1cclxuICAgICAgICBodG1sICs9ICc8L3RyPic7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLmRheXMgKyAnIHRoZWFkJykuYXBwZW5kKGh0bWwpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZmlsbE1vbnRoczogZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgaHRtbCA9ICcnO1xyXG4gICAgICAgIHZhciBpID0gMDtcclxuICAgICAgICB3aGlsZSAoaSA8IDEyKSB7XHJcbiAgICAgICAgICAgIGh0bWwgKz0gJzxzcGFuIGNsYXNzPVwiJyArIGNsYXNzZXMubW9udGggKyAnXCI+JytEUEdsb2JhbC5kYXRlcy5tb250aHNTaG9ydFtpKytdKyc8L3NwYW4+JztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLm1vbnRocyArICcgdGQnKS5hcHBlbmQoaHRtbCk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBmaWxsOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAvKmpzaGludCBtYXhzdGF0ZW1lbnRzOjY2LCBtYXhjb21wbGV4aXR5OjI4Ki9cclxuICAgICAgICB2YXIgZCA9IG5ldyBEYXRlKHRoaXMudmlld0RhdGUpLFxyXG4gICAgICAgICAgICB5ZWFyID0gZC5nZXRGdWxsWWVhcigpLFxyXG4gICAgICAgICAgICBtb250aCA9IGQuZ2V0TW9udGgoKSxcclxuICAgICAgICAgICAgY3VycmVudERhdGUgPSB0aGlzLmRhdGUudmFsdWVPZigpO1xyXG4gICAgICAgIHRoaXMucGlja2VyXHJcbiAgICAgICAgLmZpbmQoJy4nICsgY2xhc3Nlcy5kYXlzICsgJyB0aDplcSgxKScpXHJcbiAgICAgICAgLmh0bWwoRFBHbG9iYWwuZGF0ZXMubW9udGhzW21vbnRoXSArICcgJyArIHllYXIpO1xyXG4gICAgICAgIHZhciBwcmV2TW9udGggPSBuZXcgRGF0ZSh5ZWFyLCBtb250aC0xLCAyOCwwLDAsMCwwKSxcclxuICAgICAgICAgICAgZGF5ID0gRFBHbG9iYWwuZ2V0RGF5c0luTW9udGgocHJldk1vbnRoLmdldEZ1bGxZZWFyKCksIHByZXZNb250aC5nZXRNb250aCgpKTtcclxuICAgICAgICBwcmV2TW9udGguc2V0RGF0ZShkYXkpO1xyXG4gICAgICAgIHByZXZNb250aC5zZXREYXRlKGRheSAtIChwcmV2TW9udGguZ2V0RGF5KCkgLSB0aGlzLndlZWtTdGFydCArIDcpJTcpO1xyXG4gICAgICAgIHZhciBuZXh0TW9udGggPSBuZXcgRGF0ZShwcmV2TW9udGgpO1xyXG4gICAgICAgIG5leHRNb250aC5zZXREYXRlKG5leHRNb250aC5nZXREYXRlKCkgKyA0Mik7XHJcbiAgICAgICAgbmV4dE1vbnRoID0gbmV4dE1vbnRoLnZhbHVlT2YoKTtcclxuICAgICAgICB2YXIgaHRtbCA9IFtdO1xyXG4gICAgICAgIHZhciBjbHNOYW1lLFxyXG4gICAgICAgICAgICBwcmV2WSxcclxuICAgICAgICAgICAgcHJldk07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIGlmICh0aGlzLl9kYXlzQ3JlYXRlZCAhPT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAvLyBDcmVhdGUgaHRtbCAoZmlyc3QgdGltZSBvbmx5KVxyXG4gICAgICAgXHJcbiAgICAgICAgICAgIHdoaWxlKHByZXZNb250aC52YWx1ZU9mKCkgPCBuZXh0TW9udGgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGguZ2V0RGF5KCkgPT09IHRoaXMud2Vla1N0YXJ0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8dHI+Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjbHNOYW1lID0gdGhpcy5vblJlbmRlcihwcmV2TW9udGgpO1xyXG4gICAgICAgICAgICAgICAgcHJldlkgPSBwcmV2TW9udGguZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICAgICAgICAgIHByZXZNID0gcHJldk1vbnRoLmdldE1vbnRoKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoKHByZXZNIDwgbW9udGggJiYgIHByZXZZID09PSB5ZWFyKSB8fCAgcHJldlkgPCB5ZWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIG9sZCc7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKChwcmV2TSA+IG1vbnRoICYmIHByZXZZID09PSB5ZWFyKSB8fCBwcmV2WSA+IHllYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgbmV3JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGgudmFsdWVPZigpID09PSBjdXJyZW50RGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBhY3RpdmUnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8dGQgY2xhc3M9XCInICsgY2xhc3Nlcy5tb250aERheSArICcgJyArIGNsc05hbWUrJ1wiPicrcHJldk1vbnRoLmdldERhdGUoKSArICc8L3RkPicpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZNb250aC5nZXREYXkoKSA9PT0gdGhpcy53ZWVrRW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8L3RyPicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcHJldk1vbnRoLnNldERhdGUocHJldk1vbnRoLmdldERhdGUoKSsxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLmRheXMgKyAnIHRib2R5JykuZW1wdHkoKS5hcHBlbmQoaHRtbC5qb2luKCcnKSk7XHJcbiAgICAgICAgICAgIHRoaXMuX2RheXNDcmVhdGVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFVwZGF0ZSBkYXlzIHZhbHVlc1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHdlZWtUciA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy5kYXlzICsgJyB0Ym9keSB0cjpmaXJzdC1jaGlsZCgpJyk7XHJcbiAgICAgICAgICAgIHZhciBkYXlUZCA9IG51bGw7XHJcbiAgICAgICAgICAgIHdoaWxlKHByZXZNb250aC52YWx1ZU9mKCkgPCBuZXh0TW9udGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50V2Vla0RheUluZGV4ID0gcHJldk1vbnRoLmdldERheSgpIC0gdGhpcy53ZWVrU3RhcnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgY2xzTmFtZSA9IHRoaXMub25SZW5kZXIocHJldk1vbnRoKTtcclxuICAgICAgICAgICAgICAgIHByZXZZID0gcHJldk1vbnRoLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgICAgICAgICBwcmV2TSA9IHByZXZNb250aC5nZXRNb250aCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKChwcmV2TSA8IG1vbnRoICYmICBwcmV2WSA9PT0geWVhcikgfHwgIHByZXZZIDwgeWVhcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBvbGQnO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgocHJldk0gPiBtb250aCAmJiBwcmV2WSA9PT0geWVhcikgfHwgcHJldlkgPiB5ZWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIG5ldyc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAocHJldk1vbnRoLnZhbHVlT2YoKSA9PT0gY3VycmVudERhdGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgYWN0aXZlJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vaHRtbC5wdXNoKCc8dGQgY2xhc3M9XCJkYXkgJytjbHNOYW1lKydcIj4nK3ByZXZNb250aC5nZXREYXRlKCkgKyAnPC90ZD4nKTtcclxuICAgICAgICAgICAgICAgIGRheVRkID0gd2Vla1RyLmZpbmQoJ3RkOmVxKCcgKyBjdXJyZW50V2Vla0RheUluZGV4ICsgJyknKTtcclxuICAgICAgICAgICAgICAgIGRheVRkXHJcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnZGF5ICcgKyBjbHNOYW1lKVxyXG4gICAgICAgICAgICAgICAgLnRleHQocHJldk1vbnRoLmdldERhdGUoKSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIE5leHQgd2Vlaz9cclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGguZ2V0RGF5KCkgPT09IHRoaXMud2Vla0VuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdlZWtUciA9IHdlZWtUci5uZXh0KCd0cicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcHJldk1vbnRoLnNldERhdGUocHJldk1vbnRoLmdldERhdGUoKSsxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGN1cnJlbnRZZWFyID0gdGhpcy5kYXRlLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIG1vbnRocyA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy5tb250aHMpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ3RoOmVxKDEpJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmh0bWwoeWVhcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmVuZCgpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ3NwYW4nKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgaWYgKGN1cnJlbnRZZWFyID09PSB5ZWFyKSB7XHJcbiAgICAgICAgICAgIG1vbnRocy5lcSh0aGlzLmRhdGUuZ2V0TW9udGgoKSkuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBodG1sID0gJyc7XHJcbiAgICAgICAgeWVhciA9IHBhcnNlSW50KHllYXIvMTAsIDEwKSAqIDEwO1xyXG4gICAgICAgIHZhciB5ZWFyQ29udCA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy55ZWFycylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKCd0aDplcSgxKScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRleHQoeWVhciArICctJyArICh5ZWFyICsgOSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmVuZCgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgndGQnKTtcclxuICAgICAgICBcclxuICAgICAgICB5ZWFyIC09IDE7XHJcbiAgICAgICAgdmFyIGk7XHJcbiAgICAgICAgaWYgKHRoaXMuX3llYXJzQ3JlYXRlZCAhPT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgZm9yIChpID0gLTE7IGkgPCAxMTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8c3BhbiBjbGFzcz1cIicgKyBjbGFzc2VzLnllYXIgKyAoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykrKGN1cnJlbnRZZWFyID09PSB5ZWFyID8gJyBhY3RpdmUnIDogJycpKydcIj4nK3llYXIrJzwvc3Bhbj4nO1xyXG4gICAgICAgICAgICAgICAgeWVhciArPSAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB5ZWFyQ29udC5odG1sKGh0bWwpO1xyXG4gICAgICAgICAgICB0aGlzLl95ZWFyc0NyZWF0ZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciB5ZWFyU3BhbiA9IHllYXJDb250LmZpbmQoJ3NwYW46Zmlyc3QtY2hpbGQoKScpO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAtMTsgaSA8IDExOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIC8vaHRtbCArPSAnPHNwYW4gY2xhc3M9XCJ5ZWFyJysoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykrKGN1cnJlbnRZZWFyID09PSB5ZWFyID8gJyBhY3RpdmUnIDogJycpKydcIj4nK3llYXIrJzwvc3Bhbj4nO1xyXG4gICAgICAgICAgICAgICAgeWVhclNwYW5cclxuICAgICAgICAgICAgICAgIC50ZXh0KHllYXIpXHJcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAneWVhcicgKyAoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykgKyAoY3VycmVudFllYXIgPT09IHllYXIgPyAnIGFjdGl2ZScgOiAnJykpO1xyXG4gICAgICAgICAgICAgICAgeWVhciArPSAxO1xyXG4gICAgICAgICAgICAgICAgeWVhclNwYW4gPSB5ZWFyU3Bhbi5uZXh0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBtb3ZlRGF0ZTogZnVuY3Rpb24oZGlyLCBtb2RlKSB7XHJcbiAgICAgICAgLy8gZGlyIGNhbiBiZTogJ3ByZXYnLCAnbmV4dCdcclxuICAgICAgICBpZiAoWydwcmV2JywgJ25leHQnXS5pbmRleE9mKGRpciAmJiBkaXIudG9Mb3dlckNhc2UoKSkgPT0gLTEpXHJcbiAgICAgICAgICAgIC8vIE5vIHZhbGlkIG9wdGlvbjpcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAvLyBkZWZhdWx0IG1vZGUgaXMgdGhlIGN1cnJlbnQgb25lXHJcbiAgICAgICAgbW9kZSA9IG1vZGUgfHwgdGhpcy52aWV3TW9kZTtcclxuXHJcbiAgICAgICAgdGhpcy52aWV3RGF0ZVsnc2V0JytEUEdsb2JhbC5tb2Rlc1ttb2RlXS5uYXZGbmNdLmNhbGwoXHJcbiAgICAgICAgICAgIHRoaXMudmlld0RhdGUsXHJcbiAgICAgICAgICAgIHRoaXMudmlld0RhdGVbJ2dldCcrRFBHbG9iYWwubW9kZXNbbW9kZV0ubmF2Rm5jXS5jYWxsKHRoaXMudmlld0RhdGUpICsgXHJcbiAgICAgICAgICAgIERQR2xvYmFsLm1vZGVzW21vZGVdLm5hdlN0ZXAgKiAoZGlyID09PSAncHJldicgPyAtMSA6IDEpXHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLmZpbGwoKTtcclxuICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGljazogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIC8qanNoaW50IG1heGNvbXBsZXhpdHk6MTYqL1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHZhciB0YXJnZXQgPSAkKGUudGFyZ2V0KS5jbG9zZXN0KCdzcGFuLCB0ZCwgdGgnKTtcclxuICAgICAgICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICB2YXIgbW9udGgsIHllYXI7XHJcbiAgICAgICAgICAgIHN3aXRjaCh0YXJnZXRbMF0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAndGgnOlxyXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCh0YXJnZXRbMF0uY2xhc3NOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N3aXRjaCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dNb2RlKDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3ByZXYnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICduZXh0JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZURhdGUodGFyZ2V0WzBdLmNsYXNzTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdzcGFuJzpcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmlzKCcuJyArIGNsYXNzZXMubW9udGgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vbnRoID0gdGFyZ2V0LnBhcmVudCgpLmZpbmQoJ3NwYW4nKS5pbmRleCh0YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlLnNldE1vbnRoKG1vbnRoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ZWFyID0gcGFyc2VJbnQodGFyZ2V0LnRleHQoKSwgMTApfHwwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlLnNldEZ1bGxZZWFyKHllYXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy52aWV3TW9kZSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSh0aGlzLnZpZXdEYXRlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld01vZGU6IERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd01vZGUoLTEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd0ZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldC5pcygnLmRheScpICYmICF0YXJnZXQuaXMoJy5kaXNhYmxlZCcpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRheSA9IHBhcnNlSW50KHRhcmdldC50ZXh0KCksIDEwKXx8MTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggPSB0aGlzLnZpZXdEYXRlLmdldE1vbnRoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuaXMoJy5vbGQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggLT0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YXJnZXQuaXMoJy5uZXcnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggKz0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ZWFyID0gdGhpcy52aWV3RGF0ZS5nZXRGdWxsWWVhcigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgZGF5LDAsMCwwLDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGgsIE1hdGgubWluKDI4LCBkYXkpLDAsMCwwLDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld01vZGU6IERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgbW91c2Vkb3duOiBmdW5jdGlvbihlKXtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIHNob3dNb2RlOiBmdW5jdGlvbihkaXIpIHtcclxuICAgICAgICBpZiAoZGlyKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlld01vZGUgPSBNYXRoLm1heCh0aGlzLm1pblZpZXdNb2RlLCBNYXRoLm1pbigyLCB0aGlzLnZpZXdNb2RlICsgZGlyKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucGlja2VyLmZpbmQoJz5kaXYnKS5oaWRlKCkuZmlsdGVyKCcuJyArIGNsYXNzZXMuY29tcG9uZW50ICsgJy0nICsgRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZSkuc2hvdygpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuJC5mbi5kYXRlcGlja2VyID0gZnVuY3Rpb24gKCBvcHRpb24gKSB7XHJcbiAgICB2YXIgdmFscyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XHJcbiAgICB2YXIgcmV0dXJuZWQ7XHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXHJcbiAgICAgICAgICAgIGRhdGEgPSAkdGhpcy5kYXRhKCdkYXRlcGlja2VyJyksXHJcbiAgICAgICAgICAgIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09PSAnb2JqZWN0JyAmJiBvcHRpb247XHJcbiAgICAgICAgaWYgKCFkYXRhKSB7XHJcbiAgICAgICAgICAgICR0aGlzLmRhdGEoJ2RhdGVwaWNrZXInLCAoZGF0YSA9IG5ldyBEYXRlUGlja2VyKHRoaXMsICQuZXh0ZW5kKHt9LCAkLmZuLmRhdGVwaWNrZXIuZGVmYXVsdHMsb3B0aW9ucykpKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgcmV0dXJuZWQgPSBkYXRhW29wdGlvbl0uYXBwbHkoZGF0YSwgdmFscyk7XHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgdmFsdWUgcmV0dXJuZWQgYnkgdGhlIG1ldGhvZD9cclxuICAgICAgICAgICAgaWYgKHR5cGVvZihyZXR1cm5lZCAhPT0gJ3VuZGVmaW5lZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBHbyBvdXQgdGhlIGxvb3AgdG8gcmV0dXJuIHRoZSB2YWx1ZSBmcm9tIHRoZSBmaXJzdFxyXG4gICAgICAgICAgICAgICAgLy8gZWxlbWVudC1tZXRob2QgZXhlY3V0aW9uXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gRm9sbG93IG5leHQgbG9vcCBpdGVtXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBpZiAodHlwZW9mKHJldHVybmVkKSAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgcmV0dXJuIHJldHVybmVkO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIC8vIGNoYWluaW5nOlxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuJC5mbi5kYXRlcGlja2VyLmRlZmF1bHRzID0ge1xyXG4gICAgb25SZW5kZXI6IGZ1bmN0aW9uKC8qZGF0ZSovKSB7XHJcbiAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgfVxyXG59O1xyXG4kLmZuLmRhdGVwaWNrZXIuQ29uc3RydWN0b3IgPSBEYXRlUGlja2VyO1xyXG5cclxudmFyIERQR2xvYmFsID0ge1xyXG4gICAgbW9kZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNsc05hbWU6ICdkYXlzJyxcclxuICAgICAgICAgICAgbmF2Rm5jOiAnTW9udGgnLFxyXG4gICAgICAgICAgICBuYXZTdGVwOiAxXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNsc05hbWU6ICdtb250aHMnLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdGdWxsWWVhcicsXHJcbiAgICAgICAgICAgIG5hdlN0ZXA6IDFcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xzTmFtZTogJ3llYXJzJyxcclxuICAgICAgICAgICAgbmF2Rm5jOiAnRnVsbFllYXInLFxyXG4gICAgICAgICAgICBuYXZTdGVwOiAxMFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjbHNOYW1lOiAnZGF5JyxcclxuICAgICAgICAgICAgbmF2Rm5jOiAnRGF0ZScsXHJcbiAgICAgICAgICAgIG5hdlN0ZXA6IDFcclxuICAgICAgICB9XHJcbiAgICBdLFxyXG4gICAgZGF0ZXM6e1xyXG4gICAgICAgIGRheXM6IFtcIlN1bmRheVwiLCBcIk1vbmRheVwiLCBcIlR1ZXNkYXlcIiwgXCJXZWRuZXNkYXlcIiwgXCJUaHVyc2RheVwiLCBcIkZyaWRheVwiLCBcIlNhdHVyZGF5XCIsIFwiU3VuZGF5XCJdLFxyXG4gICAgICAgIGRheXNTaG9ydDogW1wiU3VuXCIsIFwiTW9uXCIsIFwiVHVlXCIsIFwiV2VkXCIsIFwiVGh1XCIsIFwiRnJpXCIsIFwiU2F0XCIsIFwiU3VuXCJdLFxyXG4gICAgICAgIGRheXNNaW46IFtcIlN1XCIsIFwiTW9cIiwgXCJUdVwiLCBcIldlXCIsIFwiVGhcIiwgXCJGclwiLCBcIlNhXCIsIFwiU3VcIl0sXHJcbiAgICAgICAgbW9udGhzOiBbXCJKYW51YXJ5XCIsIFwiRmVicnVhcnlcIiwgXCJNYXJjaFwiLCBcIkFwcmlsXCIsIFwiTWF5XCIsIFwiSnVuZVwiLCBcIkp1bHlcIiwgXCJBdWd1c3RcIiwgXCJTZXB0ZW1iZXJcIiwgXCJPY3RvYmVyXCIsIFwiTm92ZW1iZXJcIiwgXCJEZWNlbWJlclwiXSxcclxuICAgICAgICBtb250aHNTaG9ydDogW1wiSmFuXCIsIFwiRmViXCIsIFwiTWFyXCIsIFwiQXByXCIsIFwiTWF5XCIsIFwiSnVuXCIsIFwiSnVsXCIsIFwiQXVnXCIsIFwiU2VwXCIsIFwiT2N0XCIsIFwiTm92XCIsIFwiRGVjXCJdXHJcbiAgICB9LFxyXG4gICAgaXNMZWFwWWVhcjogZnVuY3Rpb24gKHllYXIpIHtcclxuICAgICAgICByZXR1cm4gKCgoeWVhciAlIDQgPT09IDApICYmICh5ZWFyICUgMTAwICE9PSAwKSkgfHwgKHllYXIgJSA0MDAgPT09IDApKTtcclxuICAgIH0sXHJcbiAgICBnZXREYXlzSW5Nb250aDogZnVuY3Rpb24gKHllYXIsIG1vbnRoKSB7XHJcbiAgICAgICAgcmV0dXJuIFszMSwgKERQR2xvYmFsLmlzTGVhcFllYXIoeWVhcikgPyAyOSA6IDI4KSwgMzEsIDMwLCAzMSwgMzAsIDMxLCAzMSwgMzAsIDMxLCAzMCwgMzFdW21vbnRoXTtcclxuICAgIH0sXHJcbiAgICBwYXJzZUZvcm1hdDogZnVuY3Rpb24oZm9ybWF0KXtcclxuICAgICAgICB2YXIgc2VwYXJhdG9yID0gZm9ybWF0Lm1hdGNoKC9bLlxcL1xcLVxcc10uKj8vKSxcclxuICAgICAgICAgICAgcGFydHMgPSBmb3JtYXQuc3BsaXQoL1xcVysvKTtcclxuICAgICAgICBpZiAoIXNlcGFyYXRvciB8fCAhcGFydHMgfHwgcGFydHMubGVuZ3RoID09PSAwKXtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBkYXRlIGZvcm1hdC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7c2VwYXJhdG9yOiBzZXBhcmF0b3IsIHBhcnRzOiBwYXJ0c307XHJcbiAgICB9LFxyXG4gICAgcGFyc2VEYXRlOiBmdW5jdGlvbihkYXRlLCBmb3JtYXQpIHtcclxuICAgICAgICAvKmpzaGludCBtYXhjb21wbGV4aXR5OjExKi9cclxuICAgICAgICB2YXIgcGFydHMgPSBkYXRlLnNwbGl0KGZvcm1hdC5zZXBhcmF0b3IpLFxyXG4gICAgICAgICAgICB2YWw7XHJcbiAgICAgICAgZGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgZGF0ZS5zZXRIb3VycygwKTtcclxuICAgICAgICBkYXRlLnNldE1pbnV0ZXMoMCk7XHJcbiAgICAgICAgZGF0ZS5zZXRTZWNvbmRzKDApO1xyXG4gICAgICAgIGRhdGUuc2V0TWlsbGlzZWNvbmRzKDApO1xyXG4gICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPT09IGZvcm1hdC5wYXJ0cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIHllYXIgPSBkYXRlLmdldEZ1bGxZZWFyKCksIGRheSA9IGRhdGUuZ2V0RGF0ZSgpLCBtb250aCA9IGRhdGUuZ2V0TW9udGgoKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaT0wLCBjbnQgPSBmb3JtYXQucGFydHMubGVuZ3RoOyBpIDwgY250OyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhbCA9IHBhcnNlSW50KHBhcnRzW2ldLCAxMCl8fDE7XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2goZm9ybWF0LnBhcnRzW2ldKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZGQnOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2QnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXkgPSB2YWw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGUuc2V0RGF0ZSh2YWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdtbSc6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vbnRoID0gdmFsIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZS5zZXRNb250aCh2YWwgLSAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAneXknOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ZWFyID0gMjAwMCArIHZhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZS5zZXRGdWxsWWVhcigyMDAwICsgdmFsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAneXl5eSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHllYXIgPSB2YWw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGUuc2V0RnVsbFllYXIodmFsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZGF0ZSA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLCBkYXksIDAgLDAgLDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0ZTtcclxuICAgIH0sXHJcbiAgICBmb3JtYXREYXRlOiBmdW5jdGlvbihkYXRlLCBmb3JtYXQpe1xyXG4gICAgICAgIHZhciB2YWwgPSB7XHJcbiAgICAgICAgICAgIGQ6IGRhdGUuZ2V0RGF0ZSgpLFxyXG4gICAgICAgICAgICBtOiBkYXRlLmdldE1vbnRoKCkgKyAxLFxyXG4gICAgICAgICAgICB5eTogZGF0ZS5nZXRGdWxsWWVhcigpLnRvU3RyaW5nKCkuc3Vic3RyaW5nKDIpLFxyXG4gICAgICAgICAgICB5eXl5OiBkYXRlLmdldEZ1bGxZZWFyKClcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhbC5kZCA9ICh2YWwuZCA8IDEwID8gJzAnIDogJycpICsgdmFsLmQ7XHJcbiAgICAgICAgdmFsLm1tID0gKHZhbC5tIDwgMTAgPyAnMCcgOiAnJykgKyB2YWwubTtcclxuICAgICAgICBkYXRlID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaT0wLCBjbnQgPSBmb3JtYXQucGFydHMubGVuZ3RoOyBpIDwgY250OyBpKyspIHtcclxuICAgICAgICAgICAgZGF0ZS5wdXNoKHZhbFtmb3JtYXQucGFydHNbaV1dKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGRhdGUuam9pbihmb3JtYXQuc2VwYXJhdG9yKTtcclxuICAgIH0sXHJcbiAgICBoZWFkVGVtcGxhdGU6ICc8dGhlYWQ+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzx0cj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0aCBjbGFzcz1cInByZXZcIj4mbHNhcXVvOzwvdGg+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGggY29sc3Bhbj1cIjVcIiBjbGFzcz1cInN3aXRjaFwiPjwvdGg+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGggY2xhc3M9XCJuZXh0XCI+JnJzYXF1bzs8L3RoPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L3RyPicrXHJcbiAgICAgICAgICAgICAgICAgICAgJzwvdGhlYWQ+JyxcclxuICAgIGNvbnRUZW1wbGF0ZTogJzx0Ym9keT48dHI+PHRkIGNvbHNwYW49XCI3XCI+PC90ZD48L3RyPjwvdGJvZHk+J1xyXG59O1xyXG5EUEdsb2JhbC50ZW1wbGF0ZSA9ICc8ZGl2IGNsYXNzPVwiJyArIGNsYXNzZXMuY29tcG9uZW50ICsgJ1wiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiJyArIGNsYXNzZXMuZGF5cyArICdcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0YWJsZSBjbGFzcz1cIiB0YWJsZS1jb25kZW5zZWRcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERQR2xvYmFsLmhlYWRUZW1wbGF0ZStcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRib2R5PjwvdGJvZHk+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L3RhYmxlPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cIicgKyBjbGFzc2VzLm1vbnRocyArICdcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0YWJsZSBjbGFzcz1cInRhYmxlLWNvbmRlbnNlZFwiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRFBHbG9iYWwuaGVhZFRlbXBsYXRlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERQR2xvYmFsLmNvbnRUZW1wbGF0ZStcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L3RhYmxlPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cIicgKyBjbGFzc2VzLnllYXJzICsgJ1wiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRhYmxlIGNsYXNzPVwidGFibGUtY29uZGVuc2VkXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEUEdsb2JhbC5oZWFkVGVtcGxhdGUrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRFBHbG9iYWwuY29udFRlbXBsYXRlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvdGFibGU+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicrXHJcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2Pic7XHJcbkRQR2xvYmFsLm1vZGVzU2V0ID0ge1xyXG4gICAgJ2RhdGUnOiBEUEdsb2JhbC5tb2Rlc1szXSxcclxuICAgICdtb250aCc6IERQR2xvYmFsLm1vZGVzWzBdLFxyXG4gICAgJ3llYXInOiBEUEdsb2JhbC5tb2Rlc1sxXSxcclxuICAgICdkZWNhZGUnOiBEUEdsb2JhbC5tb2Rlc1syXVxyXG59O1xyXG5cclxuLyoqIFB1YmxpYyBBUEkgKiovXHJcbmV4cG9ydHMuRGF0ZVBpY2tlciA9IERhdGVQaWNrZXI7XHJcbmV4cG9ydHMuZGVmYXVsdHMgPSBEUEdsb2JhbDtcclxuZXhwb3J0cy51dGlscyA9IERQR2xvYmFsO1xyXG4iLCIvKipcclxuICAgIFNtYXJ0TmF2QmFyIGNvbXBvbmVudC5cclxuICAgIFJlcXVpcmVzIGl0cyBDU1MgY291bnRlcnBhcnQuXHJcbiAgICBcclxuICAgIENyZWF0ZWQgYmFzZWQgb24gdGhlIHByb2plY3Q6XHJcbiAgICBcclxuICAgIFByb2plY3QtVHlzb25cclxuICAgIFdlYnNpdGU6IGh0dHBzOi8vZ2l0aHViLmNvbS9jMnByb2RzL1Byb2plY3QtVHlzb25cclxuICAgIEF1dGhvcjogYzJwcm9kc1xyXG4gICAgTGljZW5zZTpcclxuICAgIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxyXG4gICAgQ29weXJpZ2h0IChjKSAyMDEzIGMycHJvZHNcclxuICAgIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2ZcclxuICAgIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW5cclxuICAgIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG9cclxuICAgIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mXHJcbiAgICB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sXHJcbiAgICBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcclxuICAgIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxyXG4gICAgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cclxuICAgIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcclxuICAgIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTXHJcbiAgICBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1JcclxuICAgIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUlxyXG4gICAgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU5cclxuICAgIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuLyoqXHJcbiAgICBJbnRlcm5hbCB1dGlsaXR5LlxyXG4gICAgUmVtb3ZlcyBhbGwgY2hpbGRyZW4gZm9yIGEgRE9NIG5vZGVcclxuKiovXHJcbnZhciBjbGVhck5vZGUgPSBmdW5jdGlvbiAobm9kZSkge1xyXG4gICAgd2hpbGUobm9kZS5maXJzdENoaWxkKXtcclxuICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG5vZGUuZmlyc3RDaGlsZCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICAgIENhbGN1bGF0ZXMgYW5kIGFwcGxpZXMgdGhlIGJlc3Qgc2l6aW5nIGFuZCBkaXN0cmlidXRpb24gZm9yIHRoZSB0aXRsZVxyXG4gICAgZGVwZW5kaW5nIG9uIGNvbnRlbnQgYW5kIGJ1dHRvbnMuXHJcbiAgICBQYXNzIGluIHRoZSB0aXRsZSBlbGVtZW50LCBidXR0b25zIG11c3QgYmUgZm91bmQgYXMgc2libGluZ3Mgb2YgaXQuXHJcbioqL1xyXG52YXIgdGV4dGJveFJlc2l6ZSA9IGZ1bmN0aW9uIHRleHRib3hSZXNpemUoZWwpIHtcclxuICAgIC8qIGpzaGludCBtYXhzdGF0ZW1lbnRzOiAyOCwgbWF4Y29tcGxleGl0eToxMSAqL1xyXG4gICAgXHJcbiAgICB2YXIgbGVmdGJ0biA9IGVsLnBhcmVudE5vZGUucXVlcnlTZWxlY3RvckFsbCgnLlNtYXJ0TmF2QmFyLWVkZ2UubGVmdCcpWzBdO1xyXG4gICAgdmFyIHJpZ2h0YnRuID0gZWwucGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yQWxsKCcuU21hcnROYXZCYXItZWRnZS5yaWdodCcpWzBdO1xyXG4gICAgaWYgKHR5cGVvZiBsZWZ0YnRuID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIGxlZnRidG4gPSB7XHJcbiAgICAgICAgICAgIG9mZnNldFdpZHRoOiAwLFxyXG4gICAgICAgICAgICBjbGFzc05hbWU6ICcnXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgcmlnaHRidG4gPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgcmlnaHRidG4gPSB7XHJcbiAgICAgICAgICAgIG9mZnNldFdpZHRoOiAwLFxyXG4gICAgICAgICAgICBjbGFzc05hbWU6ICcnXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIG1hcmdpbiA9IE1hdGgubWF4KGxlZnRidG4ub2Zmc2V0V2lkdGgsIHJpZ2h0YnRuLm9mZnNldFdpZHRoKTtcclxuICAgIGVsLnN0eWxlLm1hcmdpbkxlZnQgPSBtYXJnaW4gKyAncHgnO1xyXG4gICAgZWwuc3R5bGUubWFyZ2luUmlnaHQgPSBtYXJnaW4gKyAncHgnO1xyXG4gICAgdmFyIHRvb0xvbmcgPSAoZWwub2Zmc2V0V2lkdGggPCBlbC5zY3JvbGxXaWR0aCkgPyB0cnVlIDogZmFsc2U7XHJcbiAgICBpZiAodG9vTG9uZykge1xyXG4gICAgICAgIGlmIChsZWZ0YnRuLm9mZnNldFdpZHRoIDwgcmlnaHRidG4ub2Zmc2V0V2lkdGgpIHtcclxuICAgICAgICAgICAgZWwuc3R5bGUubWFyZ2luTGVmdCA9IGxlZnRidG4ub2Zmc2V0V2lkdGggKyAncHgnO1xyXG4gICAgICAgICAgICBlbC5zdHlsZS50ZXh0QWxpZ24gPSAncmlnaHQnO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGVsLnN0eWxlLm1hcmdpblJpZ2h0ID0gcmlnaHRidG4ub2Zmc2V0V2lkdGggKyAncHgnO1xyXG4gICAgICAgICAgICBlbC5zdHlsZS50ZXh0QWxpZ24gPSAnbGVmdCc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRvb0xvbmcgPSAoZWwub2Zmc2V0V2lkdGg8ZWwuc2Nyb2xsV2lkdGgpID8gdHJ1ZSA6IGZhbHNlO1xyXG4gICAgICAgIGlmICh0b29Mb25nKSB7XHJcbiAgICAgICAgICAgIGlmIChuZXcgUmVnRXhwKCdhcnJvdycpLnRlc3QobGVmdGJ0bi5jbGFzc05hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhck5vZGUobGVmdGJ0bi5jaGlsZE5vZGVzWzFdKTtcclxuICAgICAgICAgICAgICAgIGVsLnN0eWxlLm1hcmdpbkxlZnQgPSAnMjZweCc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG5ldyBSZWdFeHAoJ2Fycm93JykudGVzdChyaWdodGJ0bi5jbGFzc05hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhck5vZGUocmlnaHRidG4uY2hpbGROb2Rlc1sxXSk7XHJcbiAgICAgICAgICAgICAgICBlbC5zdHlsZS5tYXJnaW5SaWdodCA9ICcyNnB4JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydHMudGV4dGJveFJlc2l6ZSA9IHRleHRib3hSZXNpemU7XHJcblxyXG4vKipcclxuICAgIFNtYXJ0TmF2QmFyIGNsYXNzLCBpbnN0YW50aWF0ZSB3aXRoIGEgRE9NIGVsZW1lbnRcclxuICAgIHJlcHJlc2VudGluZyBhIG5hdmJhci5cclxuICAgIEFQSTpcclxuICAgIC0gcmVmcmVzaDogdXBkYXRlcyB0aGUgY29udHJvbCB0YWtpbmcgY2FyZSBvZiB0aGUgbmVlZGVkXHJcbiAgICAgICAgd2lkdGggZm9yIHRpdGxlIGFuZCBidXR0b25zXHJcbioqL1xyXG52YXIgU21hcnROYXZCYXIgPSBmdW5jdGlvbiBTbWFydE5hdkJhcihlbCkge1xyXG4gICAgdGhpcy5lbCA9IGVsO1xyXG4gICAgXHJcbiAgICB0aGlzLnJlZnJlc2ggPSBmdW5jdGlvbiByZWZyZXNoKCkge1xyXG4gICAgICAgIHZhciBoID0gJChlbCkuY2hpbGRyZW4oJ2gxJykuZ2V0KDApO1xyXG4gICAgICAgIGlmIChoKVxyXG4gICAgICAgICAgICB0ZXh0Ym94UmVzaXplKGgpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnJlZnJlc2goKTsgXHJcbn07XHJcblxyXG5leHBvcnRzLlNtYXJ0TmF2QmFyID0gU21hcnROYXZCYXI7XHJcblxyXG4vKipcclxuICAgIEdldCBpbnN0YW5jZXMgZm9yIGFsbCB0aGUgU21hcnROYXZCYXIgZWxlbWVudHMgaW4gdGhlIERPTVxyXG4qKi9cclxuZXhwb3J0cy5nZXRBbGwgPSBmdW5jdGlvbiBnZXRBbGwoKSB7XHJcbiAgICB2YXIgYWxsID0gJCgnLlNtYXJ0TmF2QmFyJyk7XHJcbiAgICByZXR1cm4gJC5tYXAoYWxsLCBmdW5jdGlvbihpdGVtKSB7IHJldHVybiBuZXcgU21hcnROYXZCYXIoaXRlbSk7IH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBSZWZyZXNoIGFsbCBTbWFydE5hdkJhciBmb3VuZCBpbiB0aGUgZG9jdW1lbnQuXHJcbioqL1xyXG5leHBvcnRzLnJlZnJlc2hBbGwgPSBmdW5jdGlvbiByZWZyZXNoQWxsKCkge1xyXG4gICAgJCgnLlNtYXJ0TmF2QmFyID4gaDEnKS5lYWNoKGZ1bmN0aW9uKCkgeyB0ZXh0Ym94UmVzaXplKHRoaXMpOyB9KTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBDdXN0b20gTG9jb25vbWljcyAnbG9jYWxlJyBzdHlsZXMgZm9yIGRhdGUvdGltZXMuXHJcbiAgICBJdHMgYSBiaXQgbW9yZSAnY29vbCcgcmVuZGVyaW5nIGRhdGVzIDstKVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG4vLyBTaW5jZSB0aGUgdGFzayBvZiBkZWZpbmUgYSBsb2NhbGUgY2hhbmdlc1xyXG4vLyB0aGUgY3VycmVudCBnbG9iYWwgbG9jYWxlLCB3ZSBzYXZlIGEgcmVmZXJlbmNlXHJcbi8vIGFuZCByZXN0b3JlIGl0IGxhdGVyIHNvIG5vdGhpbmcgY2hhbmdlZC5cclxudmFyIGN1cnJlbnQgPSBtb21lbnQubG9jYWxlKCk7XHJcblxyXG5tb21lbnQubG9jYWxlKCdlbi1VUy1MQycsIHtcclxuICAgIG1lcmlkaWVtUGFyc2UgOiAvW2FwXVxcLj9cXC4/L2ksXHJcbiAgICBtZXJpZGllbSA6IGZ1bmN0aW9uIChob3VycywgbWludXRlcywgaXNMb3dlcikge1xyXG4gICAgICAgIGlmIChob3VycyA+IDExKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpc0xvd2VyID8gJ3AnIDogJ1AnO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpc0xvd2VyID8gJ2EnIDogJ0EnO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBjYWxlbmRhciA6IHtcclxuICAgICAgICBsYXN0RGF5IDogJ1tZZXN0ZXJkYXldJyxcclxuICAgICAgICBzYW1lRGF5IDogJ1tUb2RheV0nLFxyXG4gICAgICAgIG5leHREYXkgOiAnW1RvbW9ycm93XScsXHJcbiAgICAgICAgbGFzdFdlZWsgOiAnW2xhc3RdIGRkZGQnLFxyXG4gICAgICAgIG5leHRXZWVrIDogJ2RkZGQnLFxyXG4gICAgICAgIHNhbWVFbHNlIDogJ00vRCdcclxuICAgIH0sXHJcbiAgICBsb25nRGF0ZUZvcm1hdCA6IHtcclxuICAgICAgICBMVDogJ2g6bW1hJyxcclxuICAgICAgICBMVFM6ICdoOm1tOnNzYScsXHJcbiAgICAgICAgTDogJ01NL0REL1lZWVknLFxyXG4gICAgICAgIGw6ICdNL0QvWVlZWScsXHJcbiAgICAgICAgTEw6ICdNTU1NIERvIFlZWVknLFxyXG4gICAgICAgIGxsOiAnTU1NIEQgWVlZWScsXHJcbiAgICAgICAgTExMOiAnTU1NTSBEbyBZWVlZIExUJyxcclxuICAgICAgICBsbGw6ICdNTU0gRCBZWVlZIExUJyxcclxuICAgICAgICBMTExMOiAnZGRkZCwgTU1NTSBEbyBZWVlZIExUJyxcclxuICAgICAgICBsbGxsOiAnZGRkLCBNTU0gRCBZWVlZIExUJ1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8vIFJlc3RvcmUgbG9jYWxlXHJcbm1vbWVudC5sb2NhbGUoY3VycmVudCk7XHJcbiIsIi8qKiBBZGRyZXNzIG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBBZGRyZXNzKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGFkZHJlc3NJRDogMCxcclxuICAgICAgICBhZGRyZXNzTmFtZTogJycsXHJcbiAgICAgICAgam9iVGl0bGVJRDogMCxcclxuICAgICAgICB1c2VySUQ6IDAsXHJcbiAgICAgICAgYWRkcmVzc0xpbmUxOiBudWxsLFxyXG4gICAgICAgIGFkZHJlc3NMaW5lMjogbnVsbCxcclxuICAgICAgICBwb3N0YWxDb2RlOiBudWxsLFxyXG4gICAgICAgIGNpdHk6IG51bGwsIC8vIEF1dG9maWxsZWQgYnkgc2VydmVyXHJcbiAgICAgICAgc3RhdGVQcm92aW5jZUNvZGU6IG51bGwsIC8vIEF1dG9maWxsZWQgYnkgc2VydmVyXHJcbiAgICAgICAgc3RhdGVQcm92aWNlTmFtZTogbnVsbCwgLy8gQXV0b2ZpbGxlZCBieSBzZXJ2ZXJcclxuICAgICAgICBjb3VudHJ5Q29kZTogbnVsbCwgLy8gSVNPIEFscGhhLTIgY29kZSwgRXguOiAnVVMnXHJcbiAgICAgICAgbGF0aXR1ZGU6IG51bGwsXHJcbiAgICAgICAgbG9uZ2l0dWRlOiBudWxsLFxyXG4gICAgICAgIHNwZWNpYWxJbnN0cnVjdGlvbnM6IG51bGwsXHJcbiAgICAgICAgaXNTZXJ2aWNlQXJlYTogZmFsc2UsXHJcbiAgICAgICAgaXNTZXJ2aWNlTG9jYXRpb246IGZhbHNlLFxyXG4gICAgICAgIHNlcnZpY2VSYWRpdXM6IDAsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsIC8vIEF1dG9maWxsZWQgYnkgc2VydmVyXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGwsIC8vIEF1dG9maWxsZWQgYnkgc2VydmVyXHJcbiAgICAgICAga2luZDogJycgLy8gQXV0b2ZpbGxlZCBieSBzZXJ2ZXJcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2luZ2xlTGluZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBsaXN0ID0gW1xyXG4gICAgICAgICAgICB0aGlzLmFkZHJlc3NMaW5lMSgpLFxyXG4gICAgICAgICAgICB0aGlzLmNpdHkoKSxcclxuICAgICAgICAgICAgdGhpcy5wb3N0YWxDb2RlKCksXHJcbiAgICAgICAgICAgIHRoaXMuc3RhdGVQcm92aW5jZUNvZGUoKVxyXG4gICAgICAgIF07XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGxpc3QuZmlsdGVyKGZ1bmN0aW9uKHYpIHsgcmV0dXJuICEhdjsgfSkuam9pbignLCAnKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICAvLyBUT0RPOiBuZWVkZWQ/IGwxMG4/IG11c3QgYmUgcHJvdmlkZWQgYnkgc2VydmVyIHNpZGU/XHJcbiAgICB2YXIgY291bnRyaWVzID0ge1xyXG4gICAgICAgICdVUyc6ICdVbml0ZWQgU3RhdGVzJyxcclxuICAgICAgICAnRVMnOiAnU3BhaW4nXHJcbiAgICB9O1xyXG4gICAgdGhpcy5jb3VudHJ5TmFtZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBjb3VudHJpZXNbdGhpcy5jb3VudHJ5Q29kZSgpXSB8fCAndW5rbm93JztcclxuICAgIH0sIHRoaXMpO1xyXG5cclxuICAgIC8vIFVzZWZ1bCBHUFMgb2JqZWN0IHdpdGggdGhlIGZvcm1hdCB1c2VkIGJ5IEdvb2dsZSBNYXBzXHJcbiAgICB0aGlzLmxhdGxuZyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGxhdDogdGhpcy5sYXRpdHVkZSgpLFxyXG4gICAgICAgICAgICBsbmc6IHRoaXMubG9uZ2l0dWRlKClcclxuICAgICAgICB9O1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQWRkcmVzcztcclxuIiwiLyoqIEFwcG9pbnRtZW50IG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBDbGllbnQgPSByZXF1aXJlKCcuL0NsaWVudCcpLFxyXG4gICAgTG9jYXRpb24gPSByZXF1aXJlKCcuL0xvY2F0aW9uJyksXHJcbiAgICBTZXJ2aWNlID0gcmVxdWlyZSgnLi9TZXJ2aWNlJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuICAgXHJcbmZ1bmN0aW9uIEFwcG9pbnRtZW50KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIC8vIEFuIGFwcG9pbnRtZW50IGV2ZXIgcmVmZXJlbmNlcyBhbiBldmVudCwgYW5kIGl0cyAnaWQnIGlzIGEgQ2FsZW5kYXJFdmVudElEXHJcbiAgICAgICAgLy8gZXZlbiBpZiBvdGhlciBjb21wbGVtZW50YXJ5IG9iamVjdCBhcmUgdXNlZCBhcyAnc291cmNlJ1xyXG4gICAgICAgIGlkOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN0YXJ0VGltZTogbnVsbCxcclxuICAgICAgICBlbmRUaW1lOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEV2ZW50IHN1bW1hcnk6XHJcbiAgICAgICAgc3VtbWFyeTogJ05ldyBib29raW5nJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBzdWJ0b3RhbFByaWNlOiAwLFxyXG4gICAgICAgIGZlZVByaWNlOiAwLFxyXG4gICAgICAgIHBmZWVQcmljZTogMCxcclxuICAgICAgICB0b3RhbFByaWNlOiAwLFxyXG4gICAgICAgIHB0b3RhbFByaWNlOiAwLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHByZU5vdGVzVG9DbGllbnQ6IG51bGwsXHJcbiAgICAgICAgcG9zdE5vdGVzVG9DbGllbnQ6IG51bGwsXHJcbiAgICAgICAgcHJlTm90ZXNUb1NlbGY6IG51bGwsXHJcbiAgICAgICAgcG9zdE5vdGVzVG9TZWxmOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHNvdXJjZUV2ZW50OiBudWxsLFxyXG4gICAgICAgIHNvdXJjZUJvb2tpbmc6IG51bGxcclxuICAgICAgICAvL3NvdXJjZUJvb2tpbmdSZXF1ZXN0LCBtYXliZSBmdXR1cmU/XHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB2YWx1ZXMgPSB2YWx1ZXMgfHwge307XHJcblxyXG4gICAgdGhpcy5jbGllbnQgPSBrby5vYnNlcnZhYmxlKHZhbHVlcy5jbGllbnQgPyBuZXcgQ2xpZW50KHZhbHVlcy5jbGllbnQpIDogbnVsbCk7XHJcblxyXG4gICAgdGhpcy5sb2NhdGlvbiA9IGtvLm9ic2VydmFibGUobmV3IExvY2F0aW9uKHZhbHVlcy5sb2NhdGlvbikpO1xyXG4gICAgdGhpcy5sb2NhdGlvblN1bW1hcnkgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sb2NhdGlvbigpLnNpbmdsZUxpbmUoKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlcnZpY2VzID0ga28ub2JzZXJ2YWJsZUFycmF5KCh2YWx1ZXMuc2VydmljZXMgfHwgW10pLm1hcChmdW5jdGlvbihzZXJ2aWNlKSB7XHJcbiAgICAgICAgcmV0dXJuIChzZXJ2aWNlIGluc3RhbmNlb2YgU2VydmljZSkgPyBzZXJ2aWNlIDogbmV3IFNlcnZpY2Uoc2VydmljZSk7XHJcbiAgICB9KSk7XHJcbiAgICB0aGlzLnNlcnZpY2VzU3VtbWFyeSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNlcnZpY2VzKCkubWFwKGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNlcnZpY2UubmFtZSgpO1xyXG4gICAgICAgIH0pLmpvaW4oJywgJyk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgLy8gUHJpY2UgdXBkYXRlIG9uIHNlcnZpY2VzIGNoYW5nZXNcclxuICAgIC8vIFRPRE8gSXMgbm90IGNvbXBsZXRlIGZvciBwcm9kdWN0aW9uXHJcbiAgICB0aGlzLnNlcnZpY2VzLnN1YnNjcmliZShmdW5jdGlvbihzZXJ2aWNlcykge1xyXG4gICAgICAgIHRoaXMucHRvdGFsUHJpY2Uoc2VydmljZXMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xyXG4gICAgICAgICAgICByZXR1cm4gcHJldiArIGN1ci5wcmljZSgpO1xyXG4gICAgICAgIH0sIDApKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICBcclxuICAgIC8vIFNtYXJ0IHZpc3VhbGl6YXRpb24gb2YgZGF0ZSBhbmQgdGltZVxyXG4gICAgdGhpcy5kaXNwbGF5ZWREYXRlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBtb21lbnQodGhpcy5zdGFydFRpbWUoKSkubG9jYWxlKCdlbi1VUy1MQycpLmNhbGVuZGFyKCk7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNwbGF5ZWRTdGFydFRpbWUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzLnN0YXJ0VGltZSgpKS5sb2NhbGUoJ2VuLVVTLUxDJykuZm9ybWF0KCdMVCcpO1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzcGxheWVkRW5kVGltZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbW9tZW50KHRoaXMuZW5kVGltZSgpKS5sb2NhbGUoJ2VuLVVTLUxDJykuZm9ybWF0KCdMVCcpO1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzcGxheWVkVGltZVJhbmdlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLmRpc3BsYXllZFN0YXJ0VGltZSgpICsgJy0nICsgdGhpcy5kaXNwbGF5ZWRFbmRUaW1lKCk7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5pdFN0YXJ0ZWQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnN0YXJ0VGltZSgpICYmIG5ldyBEYXRlKCkgPj0gdGhpcy5zdGFydFRpbWUoKSk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5pdEVuZGVkID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5lbmRUaW1lKCkgJiYgbmV3IERhdGUoKSA+PSB0aGlzLmVuZFRpbWUoKSk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5pc05ldyA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKCF0aGlzLmlkKCkpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc3RhdGVIZWFkZXIgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHRleHQgPSAnJztcclxuICAgICAgICBpZiAoIXRoaXMuaXNOZXcoKSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5pdFN0YXJ0ZWQoKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXRFbmRlZCgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dCA9ICdDb21wbGV0ZWQ6JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQgPSAnTm93Oic7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ID0gJ1VwY29taW5nOic7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0ZXh0O1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXBwb2ludG1lbnQ7XHJcblxyXG4vKipcclxuICAgIENyZWF0ZXMgYW4gYXBwb2ludG1lbnQgaW5zdGFuY2UgZnJvbSBhIENhbGVuZGFyRXZlbnQgbW9kZWwgaW5zdGFuY2VcclxuKiovXHJcbkFwcG9pbnRtZW50LmZyb21DYWxlbmRhckV2ZW50ID0gZnVuY3Rpb24gZnJvbUNhbGVuZGFyRXZlbnQoZXZlbnQpIHtcclxuICAgIHZhciBhcHQgPSBuZXcgQXBwb2ludG1lbnQoKTtcclxuICAgIFxyXG4gICAgLy8gSW5jbHVkZSBldmVudCBpbiBhcHRcclxuICAgIGFwdC5pZChldmVudC5jYWxlbmRhckV2ZW50SUQoKSk7XHJcbiAgICBhcHQuc3RhcnRUaW1lKGV2ZW50LnN0YXJ0VGltZSgpKTtcclxuICAgIGFwdC5lbmRUaW1lKGV2ZW50LmVuZFRpbWUoKSk7XHJcbiAgICBhcHQuc3VtbWFyeShldmVudC5zdW1tYXJ5KCkpO1xyXG4gICAgYXB0LnNvdXJjZUV2ZW50KGV2ZW50KTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGFwdDtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgQ3JlYXRlcyBhbiBhcHBvaW50bWVudCBpbnN0YW5jZSBmcm9tIGEgQm9va2luZyBhbmQgYSBDYWxlbmRhckV2ZW50IG1vZGVsIGluc3RhbmNlc1xyXG4qKi9cclxuQXBwb2ludG1lbnQuZnJvbUJvb2tpbmcgPSBmdW5jdGlvbiBmcm9tQm9va2luZyhib29raW5nLCBldmVudCkge1xyXG4gICAgLy8gSW5jbHVkZSBldmVudCBpbiBhcHRcclxuICAgIHZhciBhcHQgPSBBcHBvaW50bWVudC5mcm9tQ2FsZW5kYXJFdmVudChldmVudCk7XHJcbiAgICBcclxuICAgIC8vIEluY2x1ZGUgYm9va2luZyBpbiBhcHRcclxuICAgIC8vIFRPRE8gTmVlZHMgcmV2aWV3LCBtYXliZSBhZnRlciByZWRvbmUgYXBwb2ludG1lbnQ6XHJcbiAgICB2YXIgcHJpY2VzID0gYm9va2luZy5ib29raW5nUmVxdWVzdCgpICYmIGJvb2tpbmcuYm9va2luZ1JlcXVlc3QoKS5wcmljaW5nRXN0aW1hdGUoKTtcclxuICAgIGlmIChwcmljZXMpIHtcclxuICAgICAgICBhcHQuc3VidG90YWxQcmljZShwcmljZXMuc3VidG90YWxQcmljZSgpKTtcclxuICAgICAgICBhcHQuZmVlUHJpY2UocHJpY2VzLmZlZVByaWNlKCkpO1xyXG4gICAgICAgIGFwdC5wZmVlUHJpY2UocHJpY2VzLnBGZWVQcmljZSgpKTtcclxuICAgICAgICBhcHQudG90YWxQcmljZShwcmljZXMudG90YWxQcmljZSgpKTtcclxuICAgICAgICBhcHQucHRvdGFsUHJpY2UocHJpY2VzLnRvdGFsUHJpY2UoKSAtIHByaWNlcy5wRmVlUHJpY2UoKSk7XHJcbiAgICB9XHJcbiAgICBhcHQuc291cmNlQm9va2luZyhib29raW5nKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGFwdDtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgQ3JlYXRlcyBhIGxpc3Qgb2YgYXBwb2ludG1lbnQgaW5zdGFuY2VzIGZyb20gdGhlIGxpc3Qgb2YgZXZlbnRzIGFuZCBib29raW5ncy5cclxuICAgIFRoZSBib29raW5ncyBsaXN0IG11c3QgY29udGFpbiBldmVyeSBib29raW5nIHRoYXQgYmVsb25ncyB0byB0aGUgZXZlbnRzIG9mIHR5cGVcclxuICAgICdib29raW5nJyBmcm9tIHRoZSBsaXN0IG9mIGV2ZW50cy5cclxuKiovXHJcbkFwcG9pbnRtZW50Lmxpc3RGcm9tQ2FsZW5kYXJFdmVudHNCb29raW5ncyA9IGZ1bmN0aW9uIGxpc3RGcm9tQ2FsZW5kYXJFdmVudHNCb29raW5ncyhldmVudHMsIGJvb2tpbmdzKSB7XHJcbiAgICByZXR1cm4gZXZlbnRzLm1hcChmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIHZhciBib29raW5nID0gbnVsbDtcclxuICAgICAgICBib29raW5ncy5zb21lKGZ1bmN0aW9uKHNlYXJjaEJvb2tpbmcpIHtcclxuICAgICAgICAgICAgdmFyIGZvdW5kID0gc2VhcmNoQm9va2luZy5jb25maXJtZWREYXRlSUQoKSA9PT0gZXZlbnQuY2FsZW5kYXJFdmVudElEKCk7XHJcbiAgICAgICAgICAgIGlmIChmb3VuZCkge1xyXG4gICAgICAgICAgICAgICAgYm9va2luZyA9IHNlYXJjaEJvb2tpbmc7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoYm9va2luZylcclxuICAgICAgICAgICAgcmV0dXJuIEFwcG9pbnRtZW50LmZyb21Cb29raW5nKGJvb2tpbmcsIGV2ZW50KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHJldHVybiBBcHBvaW50bWVudC5mcm9tQ2FsZW5kYXJFdmVudChldmVudCk7XHJcbiAgICB9KTtcclxufTtcclxuXHJcbnZhciBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xyXG4vKipcclxuICAgIENyZWF0ZXMgYW4gQXBwb2ludG1lbnQgaW5zdGFuY2UgdGhhdCByZXByZXNlbnRzIGEgY2FsZW5kYXIgc2xvdCBvZlxyXG4gICAgZnJlZS9zcGFyZSB0aW1lLCBmb3IgdGhlIGdpdmVuIHRpbWUgcmFuZ2UsIG9yIHRoZSBmdWxsIGdpdmVuIGRhdGUuXHJcbiAgICBAcGFyYW0gb3B0aW9uczpPYmplY3Qge1xyXG4gICAgICAgIGRhdGU6RGF0ZS4gT3B0aW9uYWwuIFVzZWQgdG8gY3JlYXRlIGEgZnVsbCBkYXRlIHNsb3Qgb3IgZGVmYXVsdCBmb3Igc3RhcnQvZW5kXHJcbiAgICAgICAgICAgIHRvIGRhdGUgc3RhcnQgb3IgZGF0ZSBlbmRcclxuICAgICAgICBzdGFydDpEYXRlLiBPcHRpb25hbC4gQmVnZ2luaW5nIG9mIHRoZSBzbG90XHJcbiAgICAgICAgZW5kOkRhdGUuIE9wdGlvbmFsLiBFbmRpbmcgb2YgdGhlIHNsb3RcclxuICAgICAgICB0ZXh0OnN0cmluZy4gT3B0aW9uYWwgWydGcmVlJ10uIFRvIGFsbG93IGV4dGVybmFsIGxvY2FsaXphdGlvbiBvZiB0aGUgdGV4dC5cclxuICAgIH1cclxuKiovXHJcbkFwcG9pbnRtZW50Lm5ld0ZyZWVTbG90ID0gZnVuY3Rpb24gbmV3RnJlZVNsb3Qob3B0aW9ucykge1xyXG4gICAgXHJcbiAgICB2YXIgc3RhcnQgPSBvcHRpb25zLnN0YXJ0IHx8IG5ldyBUaW1lKG9wdGlvbnMuZGF0ZSwgMCwgMCwgMCksXHJcbiAgICAgICAgZW5kID0gb3B0aW9ucy5lbmQgfHwgbmV3IFRpbWUob3B0aW9ucy5kYXRlLCAwLCAwLCAwKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IEFwcG9pbnRtZW50KHtcclxuICAgICAgICBpZDogMCxcclxuXHJcbiAgICAgICAgc3RhcnRUaW1lOiBzdGFydCxcclxuICAgICAgICBlbmRUaW1lOiBlbmQsXHJcblxyXG4gICAgICAgIHN1bW1hcnk6IG9wdGlvbnMudGV4dCB8fCAnRnJlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGxcclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKiogQm9va2luZyBtb2RlbC5cclxuXHJcbiAgICBEZXNjcmliZXMgYSBib29raW5nIHdpdGggcmVsYXRlZCBCb29raW5nUmVxdWVzdCBcclxuICAgIGFuZCBQcmljaW5nRXN0aW1hdGUgb2JqZWN0cy5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBCb29raW5nKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGJvb2tpbmdJRDogMCxcclxuICAgICAgICBib29raW5nUmVxdWVzdElEOiAwLFxyXG4gICAgICAgIGNvbmZpcm1lZERhdGVJRDogbnVsbCxcclxuICAgICAgICB0b3RhbFByaWNlUGFpZEJ5Q3VzdG9tZXI6IG51bGwsXHJcbiAgICAgICAgdG90YWxTZXJ2aWNlRmVlc1BhaWRCeUN1c3RvbWVyOiBudWxsLFxyXG4gICAgICAgIHRvdGFsUGFpZFRvRnJlZWxhbmNlcjogbnVsbCxcclxuICAgICAgICB0b3RhbFNlcnZpY2VGZWVzUGFpZEJ5RnJlZWxhbmNlcjogbnVsbCxcclxuICAgICAgICBib29raW5nU3RhdHVzSUQ6IG51bGwsXHJcbiAgICAgICAgcHJpY2luZ0FkanVzdG1lbnRBcHBsaWVkOiBmYWxzZSxcclxuICAgICAgICBcclxuICAgICAgICByZXZpZXdlZEJ5RnJlZWxhbmNlcjogZmFsc2UsXHJcbiAgICAgICAgcmV2aWV3ZWRCeUN1c3RvbWVyOiBmYWxzZSxcclxuICAgICAgICBcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBib29raW5nUmVxdWVzdDogbnVsbCAvLyBCb29raW5nUmVxdWVzdFxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5ib29raW5nUmVxdWVzdChuZXcgQm9va2luZ1JlcXVlc3QodmFsdWVzICYmIHZhbHVlcy5ib29raW5nUmVxdWVzdCkpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJvb2tpbmc7XHJcblxyXG5mdW5jdGlvbiBCb29raW5nUmVxdWVzdCh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBib29raW5nUmVxdWVzdElEOiAwLFxyXG4gICAgICAgIGJvb2tpbmdUeXBlSUQ6IDAsXHJcbiAgICAgICAgY3VzdG9tZXJVc2VySUQ6IDAsXHJcbiAgICAgICAgZnJlZWxhbmNlclVzZXJJRDogMCxcclxuICAgICAgICBqb2JUaXRsZUlEOiAwLFxyXG4gICAgICAgIHByaWNpbmdFc3RpbWF0ZUlEOiAwLFxyXG4gICAgICAgIGJvb2tpbmdSZXF1ZXN0U3RhdHVzSUQ6IDAsXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3BlY2lhbFJlcXVlc3RzOiBudWxsLFxyXG4gICAgICAgIHByZWZlcnJlZERhdGVJRDogbnVsbCxcclxuICAgICAgICBhbHRlcm5hdGl2ZURhdGUxSUQ6IG51bGwsXHJcbiAgICAgICAgYWx0ZXJuYXRpdmVEYXRlMklEOiBudWxsLFxyXG4gICAgICAgIGFkZHJlc3NJRDogbnVsbCxcclxuICAgICAgICBjYW5jZWxsYXRpb25Qb2xpY3lJRDogbnVsbCxcclxuICAgICAgICBpbnN0YW50Qm9va2luZzogZmFsc2UsXHJcbiAgICAgICAgXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgcHJpY2luZ0VzdGltYXRlOiBudWxsIC8vIFByaWNpbmdFc3RpbWF0ZVxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5wcmljaW5nRXN0aW1hdGUobmV3IFByaWNpbmdFc3RpbWF0ZSh2YWx1ZXMgJiYgdmFsdWVzLnByaWNpbmdFc3RpbWF0ZSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBQcmljaW5nRXN0aW1hdGUodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgcHJpY2luZ0VzdGltYXRlSUQ6IDAsXHJcbiAgICAgICAgcHJpY2luZ0VzdGltYXRlUmV2aXNpb246IDAsXHJcbiAgICAgICAgc2VydmljZUR1cmF0aW9uSG91cnM6IG51bGwsXHJcbiAgICAgICAgZmlyc3RTZXNzaW9uRHVyYXRpb25Ib3VyczogbnVsbCxcclxuICAgICAgICBzdWJ0b3RhbFByaWNlOiBudWxsLFxyXG4gICAgICAgIGZlZVByaWNlOiBudWxsLFxyXG4gICAgICAgIHRvdGFsUHJpY2U6IG51bGwsXHJcbiAgICAgICAgcEZlZVByaWNlOiBudWxsLFxyXG4gICAgICAgIHN1YnRvdGFsUmVmdW5kZWQ6IG51bGwsXHJcbiAgICAgICAgZmVlUmVmdW5kZWQ6IG51bGwsXHJcbiAgICAgICAgdG90YWxSZWZ1bmRlZDogbnVsbCxcclxuICAgICAgICBkYXRlUmVmdW5kZWQ6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgZGV0YWlsczogW11cclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlcy5kZXRhaWxzKSkge1xyXG4gICAgICAgIHRoaXMuZGV0YWlscyh2YWx1ZXMuZGV0YWlscy5tYXAoZnVuY3Rpb24oZGV0YWlsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJpY2luZ0VzdGltYXRlRGV0YWlsKGRldGFpbCk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBQcmljaW5nRXN0aW1hdGVEZXRhaWwodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgZnJlZWxhbmNlclByaWNpbmdJRDogMCxcclxuICAgICAgICBmcmVlbGFuY2VyUHJpY2luZ0RhdGFJbnB1dDogbnVsbCxcclxuICAgICAgICBjdXN0b21lclByaWNpbmdEYXRhSW5wdXQ6IG51bGwsXHJcbiAgICAgICAgaG91cmx5UHJpY2U6IG51bGwsXHJcbiAgICAgICAgc3VidG90YWxQcmljZTogbnVsbCxcclxuICAgICAgICBmZWVQcmljZTogbnVsbCxcclxuICAgICAgICB0b3RhbFByaWNlOiBudWxsLFxyXG4gICAgICAgIHNlcnZpY2VEdXJhdGlvbkhvdXJzOiBudWxsLFxyXG4gICAgICAgIGZpcnN0U2Vzc2lvbkR1cmF0aW9uSG91cnM6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGxcclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuIiwiLyoqIEJvb2tpbmdTdW1tYXJ5IG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuICAgIFxyXG5mdW5jdGlvbiBCb29raW5nU3VtbWFyeSh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBxdWFudGl0eTogMCxcclxuICAgICAgICBjb25jZXB0OiAnJyxcclxuICAgICAgICB0aW1lOiBudWxsLFxyXG4gICAgICAgIHRpbWVGb3JtYXQ6ICcgW0BdIGg6bW1hJ1xyXG4gICAgfSwgdmFsdWVzKTtcclxuXHJcbiAgICB0aGlzLnBocmFzZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpe1xyXG4gICAgICAgIHZhciB0ID0gdGhpcy50aW1lRm9ybWF0KCkgJiYgXHJcbiAgICAgICAgICAgIHRoaXMudGltZSgpICYmIFxyXG4gICAgICAgICAgICBtb21lbnQodGhpcy50aW1lKCkpLmZvcm1hdCh0aGlzLnRpbWVGb3JtYXQoKSkgfHxcclxuICAgICAgICAgICAgJyc7ICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpcy5jb25jZXB0KCkgKyB0O1xyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgdGhpcy51cmwgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IHRoaXMudGltZSgpICYmXHJcbiAgICAgICAgICAgICcvY2FsZW5kYXIvJyArIHRoaXMudGltZSgpLnRvSVNPU3RyaW5nKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHVybDtcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJvb2tpbmdTdW1tYXJ5O1xyXG4iLCIvKipcclxuICAgIEV2ZW50IG1vZGVsXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vKiBFeGFtcGxlIEpTT04gKHJldHVybmVkIGJ5IHRoZSBSRVNUIEFQSSk6XHJcbntcclxuICBcIkV2ZW50SURcIjogMzUzLFxyXG4gIFwiVXNlcklEXCI6IDE0MSxcclxuICBcIkV2ZW50VHlwZUlEXCI6IDMsXHJcbiAgXCJTdW1tYXJ5XCI6IFwiSG91c2VrZWVwZXIgc2VydmljZXMgZm9yIEpvaG4gRC5cIixcclxuICBcIkF2YWlsYWJpbGl0eVR5cGVJRFwiOiAzLFxyXG4gIFwiU3RhcnRUaW1lXCI6IFwiMjAxNC0wMy0yNVQwODowMDowMFpcIixcclxuICBcIkVuZFRpbWVcIjogXCIyMDE0LTAzLTI1VDE4OjAwOjAwWlwiLFxyXG4gIFwiS2luZFwiOiAwLFxyXG4gIFwiSXNBbGxEYXlcIjogZmFsc2UsXHJcbiAgXCJUaW1lWm9uZVwiOiBcIjAxOjAwOjAwXCIsXHJcbiAgXCJMb2NhdGlvblwiOiBcIm51bGxcIixcclxuICBcIlVwZGF0ZWREYXRlXCI6IFwiMjAxNC0xMC0zMFQxNTo0NDo0OS42NTNcIixcclxuICBcIkNyZWF0ZWREYXRlXCI6IG51bGwsXHJcbiAgXCJEZXNjcmlwdGlvblwiOiBcInRlc3QgZGVzY3JpcHRpb24gb2YgYSBSRVNUIGV2ZW50XCIsXHJcbiAgXCJSZWN1cnJlbmNlUnVsZVwiOiB7XHJcbiAgICBcIkZyZXF1ZW5jeVR5cGVJRFwiOiA1MDIsXHJcbiAgICBcIkludGVydmFsXCI6IDEsXHJcbiAgICBcIlVudGlsXCI6IFwiMjAxNC0wNy0wMVQwMDowMDowMFwiLFxyXG4gICAgXCJDb3VudFwiOiBudWxsLFxyXG4gICAgXCJFbmRpbmdcIjogXCJkYXRlXCIsXHJcbiAgICBcIlNlbGVjdGVkV2Vla0RheXNcIjogW1xyXG4gICAgICAxLFxyXG4gICAgXSxcclxuICAgIFwiTW9udGhseVdlZWtEYXlcIjogZmFsc2UsXHJcbiAgICBcIkluY29tcGF0aWJsZVwiOiBmYWxzZSxcclxuICAgIFwiVG9vTWFueVwiOiBmYWxzZVxyXG4gIH0sXHJcbiAgXCJSZWN1cnJlbmNlT2NjdXJyZW5jZXNcIjogbnVsbCxcclxuICBcIlJlYWRPbmx5XCI6IGZhbHNlXHJcbn0qL1xyXG5cclxuZnVuY3Rpb24gUmVjdXJyZW5jZVJ1bGUodmFsdWVzKSB7XHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBmcmVxdWVuY3lUeXBlSUQ6IDAsXHJcbiAgICAgICAgaW50ZXJ2YWw6IDEsIC8vOkludGVnZXJcclxuICAgICAgICB1bnRpbDogbnVsbCwgLy86RGF0ZVxyXG4gICAgICAgIGNvdW50OiBudWxsLCAvLzpJbnRlZ2VyXHJcbiAgICAgICAgZW5kaW5nOiBudWxsLCAvLyA6c3RyaW5nIFBvc3NpYmxlIHZhbHVlcyBhbGxvd2VkOiAnbmV2ZXInLCAnZGF0ZScsICdvY3VycmVuY2VzJ1xyXG4gICAgICAgIHNlbGVjdGVkV2Vla0RheXM6IFtdLCAvLyA6aW50ZWdlcltdIDA6U3VuZGF5XHJcbiAgICAgICAgbW9udGhseVdlZWtEYXk6IGZhbHNlLFxyXG4gICAgICAgIGluY29tcGF0aWJsZTogZmFsc2UsXHJcbiAgICAgICAgdG9vTWFueTogZmFsc2VcclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFJlY3VycmVuY2VPY2N1cnJlbmNlKHZhbHVlcykge1xyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBudWxsLCAvLzpEYXRlXHJcbiAgICAgICAgZW5kVGltZTogbnVsbCAvLzpEYXRlXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcbiAgIFxyXG5mdW5jdGlvbiBDYWxlbmRhckV2ZW50KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgLy8gU3BlY2lhbCB2YWx1ZXM6IGRhdGVzIG11c3QgYmUgY29udmVydGVkXHJcbiAgICAvLyB0byBhIERhdGUgb2JqZWN0LiBUaGV5IGNvbWUgYXMgSVNPIHN0cmluZ1xyXG4gICAgLy8gVE9ETzogTWFrZSB0aGlzIHNvbWV0aGluZyBnZW5lcmljLCBvciBldmVuIGluIE1vZGVsIGRlZmluaXRpb25zLFxyXG4gICAgLy8gYW5kIHVzZSBmb3IgdXBkYXRlZC9jcmVhdGVkRGF0ZSBhcm91bmQgYWxsIHRoZSBwcm9qZWN0XHJcbiAgICBpZiAodmFsdWVzKSB7XHJcbiAgICAgICAgdmFsdWVzLnN0YXJ0VGltZSA9IHZhbHVlcy5zdGFydFRpbWUgJiYgbmV3IERhdGUoRGF0ZS5wYXJzZSh2YWx1ZXMuc3RhcnRUaW1lKSkgfHwgbnVsbDtcclxuICAgICAgICB2YWx1ZXMuZW5kVGltZSA9IHZhbHVlcy5lbmRUaW1lICYmIG5ldyBEYXRlKERhdGUucGFyc2UodmFsdWVzLmVuZFRpbWUpKSB8fCBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgY2FsZW5kYXJFdmVudElEOiAwLFxyXG4gICAgICAgIHVzZXJJRDogMCxcclxuICAgICAgICBldmVudFR5cGVJRDogMyxcclxuICAgICAgICBzdW1tYXJ5OiAnJyxcclxuICAgICAgICBhdmFpbGFiaWxpdHlUeXBlSUQ6IDAsXHJcbiAgICAgICAgc3RhcnRUaW1lOiBudWxsLFxyXG4gICAgICAgIGVuZFRpbWU6IG51bGwsXHJcbiAgICAgICAga2luZDogMCxcclxuICAgICAgICBpc0FsbERheTogZmFsc2UsXHJcbiAgICAgICAgdGltZVpvbmU6ICdaJyxcclxuICAgICAgICBsb2NhdGlvbjogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJycsXHJcbiAgICAgICAgcmVhZE9ubHk6IGZhbHNlXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG5cclxuICAgIHRoaXMucmVjdXJyZW5jZVJ1bGUgPSBrby5vYnNlcnZhYmxlKFxyXG4gICAgICAgIHZhbHVlcyAmJiBcclxuICAgICAgICB2YWx1ZXMucmVjdXJyZW5jZVJ1bGUgJiYgXHJcbiAgICAgICAgbmV3IFJlY3VycmVuY2VSdWxlKHZhbHVlcy5yZWN1cnJlbmNlUnVsZSlcclxuICAgICk7XHJcbiAgICB0aGlzLnJlY3VycmVuY2VPY2N1cnJlbmNlcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7IC8vOlJlY3VycmVuY2VPY2N1cnJlbmNlW11cclxuICAgIGlmICh2YWx1ZXMgJiYgdmFsdWVzLnJlY3VycmVuY2VPY2N1cnJlbmNlcykge1xyXG4gICAgICAgIHZhbHVlcy5yZWN1cnJlbmNlT2NjdXJyZW5jZXMuZm9yRWFjaChmdW5jdGlvbihvY2N1cnJlbmNlKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLlJlY3VycmVuY2VPY2N1cnJlbmNlcy5wdXNoKG5ldyBSZWN1cnJlbmNlT2NjdXJyZW5jZShvY2N1cnJlbmNlKSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ2FsZW5kYXJFdmVudDtcclxuXHJcbkNhbGVuZGFyRXZlbnQuUmVjdXJyZW5jZVJ1bGUgPSBSZWN1cnJlbmNlUnVsZTtcclxuQ2FsZW5kYXJFdmVudC5SZWN1cnJlbmNlT2NjdXJyZW5jZSA9IFJlY3VycmVuY2VPY2N1cnJlbmNlOyIsIi8qKlxyXG4gICAgQ2FsZW5kYXJTeW5jaW5nIG1vZGVsLlxyXG4gKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIENhbGVuZGFyU3luY2luZyh2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGljYWxFeHBvcnRVcmw6ICcnLFxyXG4gICAgICAgIGljYWxJbXBvcnRVcmw6ICcnXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENhbGVuZGFyU3luY2luZztcclxuIiwiLyoqIENsaWVudCBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuLy8gVE9ETyBEb3VibGUgY2hlY2sgVXNlciwgbXVzdCBiZSB0aGUgc2FtZSBvciBleHRlbmRlZD8/XHJcblxyXG5mdW5jdGlvbiBDbGllbnQodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGlkOiAwLFxyXG4gICAgICAgIGZpcnN0TmFtZTogJycsXHJcbiAgICAgICAgbGFzdE5hbWU6ICcnLFxyXG4gICAgICAgIGVtYWlsOiAnJyxcclxuICAgICAgICBwaG9uZTogbnVsbCxcclxuICAgICAgICBjYW5SZWNlaXZlU21zOiBmYWxzZSxcclxuICAgICAgICBiaXJ0aE1vbnRoRGF5OiBudWxsLFxyXG4gICAgICAgIGJpcnRoTW9udGg6IG51bGwsXHJcbiAgICAgICAgbm90ZXNBYm91dENsaWVudDogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxuXHJcbiAgICB0aGlzLmZ1bGxOYW1lID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5maXJzdE5hbWUoKSArICcgJyArIHRoaXMubGFzdE5hbWUoKSk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5iaXJ0aERheSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAodGhpcy5iaXJ0aE1vbnRoRGF5KCkgJiZcclxuICAgICAgICAgICAgdGhpcy5iaXJ0aE1vbnRoKCkpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFRPRE8gaTEwblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5iaXJ0aE1vbnRoKCkgKyAnLycgKyB0aGlzLmJpcnRoTW9udGhEYXkoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENsaWVudDtcclxuIiwiLyoqIEdldE1vcmUgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIExpc3RWaWV3SXRlbSA9IHJlcXVpcmUoJy4vTGlzdFZpZXdJdGVtJyk7XHJcblxyXG5mdW5jdGlvbiBHZXRNb3JlKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgYXZhaWxhYmlsaXR5OiBmYWxzZSxcclxuICAgICAgICBwYXltZW50czogZmFsc2UsXHJcbiAgICAgICAgcHJvZmlsZTogZmFsc2UsXHJcbiAgICAgICAgY29vcDogdHJ1ZVxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdmFyIGF2YWlsYWJsZUl0ZW1zID0ge1xyXG4gICAgICAgIGF2YWlsYWJpbGl0eTogbmV3IExpc3RWaWV3SXRlbSh7XHJcbiAgICAgICAgICAgIGNvbnRlbnRMaW5lMTogJ0NvbXBsZXRlIHlvdXIgYXZhaWxhYmlsaXR5IHRvIGNyZWF0ZSBhIGNsZWFuZXIgY2FsZW5kYXInLFxyXG4gICAgICAgICAgICBtYXJrZXJJY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1jYWxlbmRhcicsXHJcbiAgICAgICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tcmlnaHQnXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgcGF5bWVudHM6IG5ldyBMaXN0Vmlld0l0ZW0oe1xyXG4gICAgICAgICAgICBjb250ZW50TGluZTE6ICdTdGFydCBhY2NlcHRpbmcgcGF5bWVudHMgdGhyb3VnaCBMb2Nvbm9taWNzJyxcclxuICAgICAgICAgICAgbWFya2VySWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tdXNkJyxcclxuICAgICAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1yaWdodCdcclxuICAgICAgICB9KSxcclxuICAgICAgICBwcm9maWxlOiBuZXcgTGlzdFZpZXdJdGVtKHtcclxuICAgICAgICAgICAgY29udGVudExpbmUxOiAnQWN0aXZhdGUgeW91ciBwcm9maWxlIGluIHRoZSBtYXJrZXRwbGFjZScsXHJcbiAgICAgICAgICAgIG1hcmtlckljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXVzZXInLFxyXG4gICAgICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0J1xyXG4gICAgICAgIH0pLFxyXG4gICAgICAgIGNvb3A6IG5ldyBMaXN0Vmlld0l0ZW0oe1xyXG4gICAgICAgICAgICBjb250ZW50TGluZTE6ICdMZWFybiBtb3JlIGFib3V0IG91ciBjb29wZXJhdGl2ZScsXHJcbiAgICAgICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tcmlnaHQnXHJcbiAgICAgICAgfSlcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pdGVtcyA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcclxuICAgICAgICBcclxuICAgICAgICBPYmplY3Qua2V5cyhhdmFpbGFibGVJdGVtcykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICh0aGlzW2tleV0oKSlcclxuICAgICAgICAgICAgICAgIGl0ZW1zLnB1c2goYXZhaWxhYmxlSXRlbXNba2V5XSk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGl0ZW1zO1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gR2V0TW9yZTtcclxuIiwiLyoqIEpvYlRpdGxlIG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBKb2JUaXRsZVByaWNpbmdUeXBlID0gcmVxdWlyZSgnLi9Kb2JUaXRsZVByaWNpbmdUeXBlJyk7XHJcblxyXG5mdW5jdGlvbiBKb2JUaXRsZSh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgam9iVGl0bGVJRDogMCxcclxuICAgICAgICBzaW5ndWxhck5hbWU6ICcnLFxyXG4gICAgICAgIHBsdXJhbE5hbWU6ICcnLFxyXG4gICAgICAgIGFsaWFzZXM6ICcnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIHNlYXJjaERlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBudWxsLFxyXG4gICAgICAgIHVwZGF0ZWREYXRlOiBudWxsXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmSUQoWydqb2JUaXRsZUlEJ10pO1xyXG5cclxuICAgIC8vIFByaWNpbmcgVHlwZXMgcmVsYXRpb25zaGlwLFxyXG4gICAgLy8gY29sbGVjdGlvbiBvZiBKb2JUaXRsZVByaWNpbmdUeXBlIGVudGl0aWVzXHJcbiAgICB0aGlzLnByaWNpbmdUeXBlcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcbiAgICBpZiAodmFsdWVzICYmIHZhbHVlcy5wcmljaW5nVHlwZXMpIHtcclxuICAgICAgICB2YWx1ZXMucHJpY2luZ1R5cGVzLmZvckVhY2goZnVuY3Rpb24oam9icHJpY2luZykge1xyXG4gICAgICAgICAgICB0aGlzLnByaWNpbmdUeXBlcy5wdXNoKG5ldyBKb2JUaXRsZVByaWNpbmdUeXBlKGpvYnByaWNpbmcpKTtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEpvYlRpdGxlO1xyXG4iLCIvKipcclxuICAgIERlZmluZXMgdGhlIHJlbGF0aW9uc2hpcCBiZXR3ZWVuIGEgSm9iVGl0bGUgYW5kIGEgUHJpY2luZ1R5cGUuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBKb2JUaXRsZVByaWNpbmdUeXBlKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHByaWNpbmdUeXBlSUQ6IDAsXHJcbiAgICAgICAgLy8gTk9URTogQ2xpZW50IFR5cGUgaXMgbW9zdGx5IHVudXNlZCB0b2RheSBidXQgZXhpc3RzXHJcbiAgICAgICAgLy8gb24gYWxsIGRhdGFiYXNlIHJlY29yZHMuIEl0IHVzZXMgdGhlIGRlZmF1bHQgdmFsdWVcclxuICAgICAgICAvLyBvZiAxIGFsbCB0aGUgdGltZSBmb3Igbm93LlxyXG4gICAgICAgIGNsaWVudFR5cGVJRDogMSxcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZJRChbJ3ByaWNpbmdUeXBlSUQnLCAnY2xpZW50VHlwZUlEJ10pO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEpvYlRpdGxlUHJpY2luZ1R5cGU7XHJcbiIsIi8qKiBMaXN0Vmlld0l0ZW0gbW9kZWwuXHJcblxyXG4gICAgRGVzY3JpYmVzIGEgZ2VuZXJpYyBpdGVtIG9mIGFcclxuICAgIExpc3RWaWV3IGNvbXBvbmVudC5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBMaXN0Vmlld0l0ZW0odmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgbWFya2VyTGluZTE6IG51bGwsXHJcbiAgICAgICAgbWFya2VyTGluZTI6IG51bGwsXHJcbiAgICAgICAgbWFya2VySWNvbjogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBjb250ZW50TGluZTE6ICcnLFxyXG4gICAgICAgIGNvbnRlbnRMaW5lMjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBjbGFzc05hbWVzOiAnJ1xyXG5cclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTGlzdFZpZXdJdGVtO1xyXG4iLCIvKiogTG9jYXRpb24gbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIExvY2F0aW9uKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGxvY2F0aW9uSUQ6IDAsXHJcbiAgICAgICAgbmFtZTogJycsXHJcbiAgICAgICAgYWRkcmVzc0xpbmUxOiBudWxsLFxyXG4gICAgICAgIGFkZHJlc3NMaW5lMjogbnVsbCxcclxuICAgICAgICBjaXR5OiBudWxsLFxyXG4gICAgICAgIHN0YXRlUHJvdmluY2VDb2RlOiBudWxsLFxyXG4gICAgICAgIHN0YXRlUHJvdmljZUlEOiBudWxsLFxyXG4gICAgICAgIHBvc3RhbENvZGU6IG51bGwsXHJcbiAgICAgICAgcG9zdGFsQ29kZUlEOiBudWxsLFxyXG4gICAgICAgIGNvdW50cnlJRDogbnVsbCxcclxuICAgICAgICBsYXRpdHVkZTogbnVsbCxcclxuICAgICAgICBsb25naXR1ZGU6IG51bGwsXHJcbiAgICAgICAgc3BlY2lhbEluc3RydWN0aW9uczogbnVsbCxcclxuICAgICAgICBpc1NlcnZpY2VSYWRpdXM6IGZhbHNlLFxyXG4gICAgICAgIGlzU2VydmljZUxvY2F0aW9uOiBmYWxzZSxcclxuICAgICAgICBzZXJ2aWNlUmFkaXVzOiAwXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNpbmdsZUxpbmUgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgbGlzdCA9IFtcclxuICAgICAgICAgICAgdGhpcy5hZGRyZXNzTGluZTEoKSxcclxuICAgICAgICAgICAgdGhpcy5jaXR5KCksXHJcbiAgICAgICAgICAgIHRoaXMucG9zdGFsQ29kZSgpLFxyXG4gICAgICAgICAgICB0aGlzLnN0YXRlUHJvdmluY2VDb2RlKClcclxuICAgICAgICBdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBsaXN0LmZpbHRlcihmdW5jdGlvbih2KSB7IHJldHVybiAhIXY7IH0pLmpvaW4oJywgJyk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5jb3VudHJ5TmFtZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMuY291bnRyeUlEKCkgPT09IDEgP1xyXG4gICAgICAgICAgICAnVW5pdGVkIFN0YXRlcycgOlxyXG4gICAgICAgICAgICB0aGlzLmNvdW50cnlJRCgpID09PSAyID9cclxuICAgICAgICAgICAgJ1NwYWluJyA6XHJcbiAgICAgICAgICAgICd1bmtub3cnXHJcbiAgICAgICAgKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmNvdW50cnlDb2RlQWxwaGEyID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5jb3VudHJ5SUQoKSA9PT0gMSA/XHJcbiAgICAgICAgICAgICdVUycgOlxyXG4gICAgICAgICAgICB0aGlzLmNvdW50cnlJRCgpID09PSAyID9cclxuICAgICAgICAgICAgJ0VTJyA6XHJcbiAgICAgICAgICAgICcnXHJcbiAgICAgICAgKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmxhdGxuZyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGxhdDogdGhpcy5sYXRpdHVkZSgpLFxyXG4gICAgICAgICAgICBsbmc6IHRoaXMubG9uZ2l0dWRlKClcclxuICAgICAgICB9O1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTG9jYXRpb247XHJcbiIsIi8qKiBNYWlsRm9sZGVyIG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XHJcblxyXG5mdW5jdGlvbiBNYWlsRm9sZGVyKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgbWVzc2FnZXM6IFtdLFxyXG4gICAgICAgIHRvcE51bWJlcjogMTBcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMudG9wID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uIHRvcChudW0pIHtcclxuICAgICAgICBpZiAobnVtKSB0aGlzLnRvcE51bWJlcihudW0pO1xyXG4gICAgICAgIHJldHVybiBfLmZpcnN0KHRoaXMubWVzc2FnZXMoKSwgdGhpcy50b3BOdW1iZXIoKSk7XHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNYWlsRm9sZGVyO1xyXG4iLCIvKiogTWFya2V0cGxhY2VQcm9maWxlIG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBNYXJrZXRwbGFjZVByb2ZpbGUodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHVzZXJJRDogMCxcclxuICAgICAgICBcclxuICAgICAgICBwdWJsaWNCaW86ICcnLFxyXG4gICAgICAgIGZyZWVsYW5jZXJQcm9maWxlVXJsU2x1ZzogJycsXHJcbiAgICAgICAgLy8gVGhpcyBpcyBhIHNlcnZlci1zaWRlIGNvbXB1dGVkIHZhcmlhYmxlIChyZWFkLW9ubHkgZm9yIHRoZSB1c2VyKSBmb3IgYSBMb2Nvbm9taWNzIGFkZHJlc3NcclxuICAgICAgICAvLyBjcmVhdGVkIHVzaW5nIHRoZSBmcmVlbGFuY2VyUHJvZmlsZVVybFNsdWcgaWYgYW55IG9yIHRoZSBmYWxsYmFjayBzeXN0ZW0gVVJMLlxyXG4gICAgICAgIGZyZWVsYW5jZXJQcm9maWxlVXJsOiAnJyxcclxuICAgICAgICAvLyBTcGVjaWZ5IGFuIGV4dGVybmFsIHdlYnNpdGUgb2YgdGhlIGZyZWVsYW5jZXIuXHJcbiAgICAgICAgZnJlZWxhbmNlcldlYnNpdGVVcmw6ICcnLFxyXG4gICAgICAgIC8vIFNlcnZlci1zaWRlIGdlbmVyYXRlZCBjb2RlIHRoYXQgYWxsb3dzIHRvIGlkZW50aWZpY2F0ZSBzcGVjaWFsIGJvb2tpbmcgcmVxdWVzdHNcclxuICAgICAgICAvLyBmcm9tIHRoZSBib29rLW1lLW5vdyBidXR0b24uIFRoZSBzZXJ2ZXIgZW5zdXJlcyB0aGF0IHRoZXJlIGlzIGV2ZXIgYSB2YWx1ZSBvbiB0aGlzIGZvciBmcmVlbGFuY2Vycy5cclxuICAgICAgICBib29rQ29kZTogJycsXHJcblxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBudWxsLFxyXG4gICAgICAgIHVwZGF0ZWREYXRlOiBudWxsXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1hcmtldHBsYWNlUHJvZmlsZTtcclxuIiwiLyoqIE1lc3NhZ2UgbW9kZWwuXHJcblxyXG4gICAgRGVzY3JpYmVzIGEgbWVzc2FnZSBmcm9tIGEgTWFpbEZvbGRlci5cclxuICAgIEEgbWVzc2FnZSBjb3VsZCBiZSBvZiBkaWZmZXJlbnQgdHlwZXMsXHJcbiAgICBhcyBpbnF1aXJpZXMsIGJvb2tpbmdzLCBib29raW5nIHJlcXVlc3RzLlxyXG4gKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG4vL1RPRE8gICBUaHJlYWQgPSByZXF1aXJlKCcuL1RocmVhZCcpO1xyXG5cclxuZnVuY3Rpb24gTWVzc2FnZSh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBpZDogMCxcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnJyxcclxuICAgICAgICBjb250ZW50OiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICcnXHJcblxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgLy8gU21hcnQgdmlzdWFsaXphdGlvbiBvZiBkYXRlIGFuZCB0aW1lXHJcbiAgICB0aGlzLmRpc3BsYXllZERhdGUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzLmNyZWF0ZWREYXRlKCkpLmxvY2FsZSgnZW4tVVMtTEMnKS5jYWxlbmRhcigpO1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzcGxheWVkVGltZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbW9tZW50KHRoaXMuY3JlYXRlZERhdGUoKSkubG9jYWxlKCdlbi1VUy1MQycpLmZvcm1hdCgnTFQnKTtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1lc3NhZ2U7XHJcbiIsIi8qKlxyXG4gICAgTW9kZWwgY2xhc3MgdG8gaGVscCBidWlsZCBtb2RlbHMuXHJcblxyXG4gICAgSXMgbm90IGV4YWN0bHkgYW4gJ09PUCBiYXNlJyBjbGFzcywgYnV0IHByb3ZpZGVzXHJcbiAgICB1dGlsaXRpZXMgdG8gbW9kZWxzIGFuZCBhIG1vZGVsIGRlZmluaXRpb24gb2JqZWN0XHJcbiAgICB3aGVuIGV4ZWN1dGVkIGluIHRoZWlyIGNvbnN0cnVjdG9ycyBhczpcclxuICAgIFxyXG4gICAgJycnXHJcbiAgICBmdW5jdGlvbiBNeU1vZGVsKCkge1xyXG4gICAgICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgICAgIC8vIE5vdywgdGhlcmUgaXMgYSB0aGlzLm1vZGVsIHByb3BlcnR5IHdpdGhcclxuICAgICAgICAvLyBhbiBpbnN0YW5jZSBvZiB0aGUgTW9kZWwgY2xhc3MsIHdpdGggXHJcbiAgICAgICAgLy8gdXRpbGl0aWVzIGFuZCBtb2RlbCBzZXR0aW5ncy5cclxuICAgIH1cclxuICAgICcnJ1xyXG4gICAgXHJcbiAgICBUaGF0IGF1dG8gY3JlYXRpb24gb2YgJ21vZGVsJyBwcm9wZXJ0eSBjYW4gYmUgYXZvaWRlZFxyXG4gICAgd2hlbiB1c2luZyB0aGUgb2JqZWN0IGluc3RhbnRpYXRpb24gc3ludGF4ICgnbmV3JyBrZXl3b3JkKTpcclxuICAgIFxyXG4gICAgJycnXHJcbiAgICB2YXIgbW9kZWwgPSBuZXcgTW9kZWwob2JqKTtcclxuICAgIC8vIFRoZXJlIGlzIG5vIGEgJ29iai5tb2RlbCcgcHJvcGVydHksIGNhbiBiZVxyXG4gICAgLy8gYXNzaWduZWQgdG8gd2hhdGV2ZXIgcHJvcGVydHkgb3Igbm90aGluZy5cclxuICAgICcnJ1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG5rby5tYXBwaW5nID0gcmVxdWlyZSgna25vY2tvdXQubWFwcGluZycpO1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgY2xvbmUgPSBmdW5jdGlvbihvYmopIHsgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHt9LCBvYmopOyB9O1xyXG5cclxuZnVuY3Rpb24gTW9kZWwobW9kZWxPYmplY3QpIHtcclxuICAgIFxyXG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIE1vZGVsKSkge1xyXG4gICAgICAgIC8vIEV4ZWN1dGVkIGFzIGEgZnVuY3Rpb24sIGl0IG11c3QgY3JlYXRlXHJcbiAgICAgICAgLy8gYSBNb2RlbCBpbnN0YW5jZVxyXG4gICAgICAgIHZhciBtb2RlbCA9IG5ldyBNb2RlbChtb2RlbE9iamVjdCk7XHJcbiAgICAgICAgLy8gYW5kIHJlZ2lzdGVyIGF1dG9tYXRpY2FsbHkgYXMgcGFydFxyXG4gICAgICAgIC8vIG9mIHRoZSBtb2RlbE9iamVjdCBpbiAnbW9kZWwnIHByb3BlcnR5XHJcbiAgICAgICAgbW9kZWxPYmplY3QubW9kZWwgPSBtb2RlbDtcclxuICAgICAgICBcclxuICAgICAgICAvLyBSZXR1cm5zIHRoZSBpbnN0YW5jZVxyXG4gICAgICAgIHJldHVybiBtb2RlbDtcclxuICAgIH1cclxuIFxyXG4gICAgLy8gSXQgaW5jbHVkZXMgYSByZWZlcmVuY2UgdG8gdGhlIG9iamVjdFxyXG4gICAgdGhpcy5tb2RlbE9iamVjdCA9IG1vZGVsT2JqZWN0O1xyXG4gICAgLy8gSXQgbWFpbnRhaW5zIGEgbGlzdCBvZiBwcm9wZXJ0aWVzIGFuZCBmaWVsZHNcclxuICAgIHRoaXMucHJvcGVydGllc0xpc3QgPSBbXTtcclxuICAgIHRoaXMuZmllbGRzTGlzdCA9IFtdO1xyXG4gICAgLy8gSXQgYWxsb3cgc2V0dGluZyB0aGUgJ2tvLm1hcHBpbmcuZnJvbUpTJyBtYXBwaW5nIG9wdGlvbnNcclxuICAgIC8vIHRvIGNvbnRyb2wgY29udmVyc2lvbnMgZnJvbSBwbGFpbiBKUyBvYmplY3RzIHdoZW4gXHJcbiAgICAvLyAndXBkYXRlV2l0aCcuXHJcbiAgICB0aGlzLm1hcHBpbmdPcHRpb25zID0ge307XHJcbiAgICBcclxuICAgIC8vIFRpbWVzdGFtcCB3aXRoIHRoZSBkYXRlIG9mIGxhc3QgY2hhbmdlXHJcbiAgICAvLyBpbiB0aGUgZGF0YSAoYXV0b21hdGljYWxseSB1cGRhdGVkIHdoZW4gY2hhbmdlc1xyXG4gICAgLy8gaGFwcGVucyBvbiBwcm9wZXJ0aWVzOyBmaWVsZHMgb3IgYW55IG90aGVyIG1lbWJlclxyXG4gICAgLy8gYWRkZWQgdG8gdGhlIG1vZGVsIGNhbm5vdCBiZSBvYnNlcnZlZCBmb3IgY2hhbmdlcyxcclxuICAgIC8vIHJlcXVpcmluZyBtYW51YWwgdXBkYXRpbmcgd2l0aCBhICduZXcgRGF0ZSgpJywgYnV0IGlzXHJcbiAgICAvLyBiZXR0ZXIgdG8gdXNlIHByb3BlcnRpZXMuXHJcbiAgICAvLyBJdHMgcmF0ZWQgdG8gemVybyBqdXN0IHRvIGF2b2lkIHRoYXQgY29uc2VjdXRpdmVcclxuICAgIC8vIHN5bmNocm9ub3VzIGNoYW5nZXMgZW1pdCBsb3Qgb2Ygbm90aWZpY2F0aW9ucywgc3BlY2lhbGx5XHJcbiAgICAvLyB3aXRoIGJ1bGsgdGFza3MgbGlrZSAndXBkYXRlV2l0aCcuXHJcbiAgICB0aGlzLmRhdGFUaW1lc3RhbXAgPSBrby5vYnNlcnZhYmxlKG5ldyBEYXRlKCkpLmV4dGVuZCh7IHJhdGVMaW1pdDogMCB9KTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNb2RlbDtcclxuXHJcbi8qKlxyXG4gICAgRGVmaW5lIG9ic2VydmFibGUgcHJvcGVydGllcyB1c2luZyB0aGUgZ2l2ZW5cclxuICAgIHByb3BlcnRpZXMgb2JqZWN0IGRlZmluaXRpb24gdGhhdCBpbmNsdWRlcyBkZSBkZWZhdWx0IHZhbHVlcyxcclxuICAgIGFuZCBzb21lIG9wdGlvbmFsIGluaXRpYWxWYWx1ZXMgKG5vcm1hbGx5IHRoYXQgaXMgcHJvdmlkZWQgZXh0ZXJuYWxseVxyXG4gICAgYXMgYSBwYXJhbWV0ZXIgdG8gdGhlIG1vZGVsIGNvbnN0cnVjdG9yLCB3aGlsZSBkZWZhdWx0IHZhbHVlcyBhcmVcclxuICAgIHNldCBpbiB0aGUgY29uc3RydWN0b3IpLlxyXG4gICAgVGhhdCBwcm9wZXJ0aWVzIGJlY29tZSBtZW1iZXJzIG9mIHRoZSBtb2RlbE9iamVjdCwgc2ltcGxpZnlpbmcgXHJcbiAgICBtb2RlbCBkZWZpbml0aW9ucy5cclxuICAgIFxyXG4gICAgSXQgdXNlcyBLbm9ja291dC5vYnNlcnZhYmxlIGFuZCBvYnNlcnZhYmxlQXJyYXksIHNvIHByb3BlcnRpZXNcclxuICAgIGFyZSBmdW50aW9ucyB0aGF0IHJlYWRzIHRoZSB2YWx1ZSB3aGVuIG5vIGFyZ3VtZW50cyBvciBzZXRzIHdoZW5cclxuICAgIG9uZSBhcmd1bWVudCBpcyBwYXNzZWQgb2YuXHJcbioqL1xyXG5Nb2RlbC5wcm90b3R5cGUuZGVmUHJvcGVydGllcyA9IGZ1bmN0aW9uIGRlZlByb3BlcnRpZXMocHJvcGVydGllcywgaW5pdGlhbFZhbHVlcykge1xyXG5cclxuICAgIGluaXRpYWxWYWx1ZXMgPSBpbml0aWFsVmFsdWVzIHx8IHt9O1xyXG5cclxuICAgIHZhciBtb2RlbE9iamVjdCA9IHRoaXMubW9kZWxPYmplY3QsXHJcbiAgICAgICAgcHJvcGVydGllc0xpc3QgPSB0aGlzLnByb3BlcnRpZXNMaXN0LFxyXG4gICAgICAgIGRhdGFUaW1lc3RhbXAgPSB0aGlzLmRhdGFUaW1lc3RhbXA7XHJcblxyXG4gICAgT2JqZWN0LmtleXMocHJvcGVydGllcykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgZGVmVmFsID0gcHJvcGVydGllc1trZXldO1xyXG4gICAgICAgIC8vIENyZWF0ZSBvYnNlcnZhYmxlIHByb3BlcnR5IHdpdGggZGVmYXVsdCB2YWx1ZVxyXG4gICAgICAgIG1vZGVsT2JqZWN0W2tleV0gPSBBcnJheS5pc0FycmF5KGRlZlZhbCkgP1xyXG4gICAgICAgICAgICBrby5vYnNlcnZhYmxlQXJyYXkoZGVmVmFsKSA6XHJcbiAgICAgICAgICAgIGtvLm9ic2VydmFibGUoZGVmVmFsKTtcclxuICAgICAgICAvLyBSZW1lbWJlciBkZWZhdWx0XHJcbiAgICAgICAgbW9kZWxPYmplY3Rba2V5XS5fZGVmYXVsdFZhbHVlID0gZGVmVmFsO1xyXG4gICAgICAgIC8vIHJlbWVtYmVyIGluaXRpYWxcclxuICAgICAgICBtb2RlbE9iamVjdFtrZXldLl9pbml0aWFsVmFsdWUgPSBpbml0aWFsVmFsdWVzW2tleV07XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgYW4gaW5pdGlhbFZhbHVlLCBzZXQgaXQ6XHJcbiAgICAgICAgaWYgKHR5cGVvZihpbml0aWFsVmFsdWVzW2tleV0pICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICBtb2RlbE9iamVjdFtrZXldKGluaXRpYWxWYWx1ZXNba2V5XSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEFkZCBzdWJzY3JpYmVyIHRvIHVwZGF0ZSB0aGUgdGltZXN0YW1wIG9uIGNoYW5nZXNcclxuICAgICAgICBtb2RlbE9iamVjdFtrZXldLnN1YnNjcmliZShmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgZGF0YVRpbWVzdGFtcChuZXcgRGF0ZSgpKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBBZGQgdG8gdGhlIGludGVybmFsIHJlZ2lzdHJ5XHJcbiAgICAgICAgcHJvcGVydGllc0xpc3QucHVzaChrZXkpO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIFVwZGF0ZSB0aW1lc3RhbXAgYWZ0ZXIgdGhlIGJ1bGsgY3JlYXRpb24uXHJcbiAgICBkYXRhVGltZXN0YW1wKG5ldyBEYXRlKCkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBEZWZpbmUgZmllbGRzIGFzIHBsYWluIG1lbWJlcnMgb2YgdGhlIG1vZGVsT2JqZWN0IHVzaW5nXHJcbiAgICB0aGUgZmllbGRzIG9iamVjdCBkZWZpbml0aW9uIHRoYXQgaW5jbHVkZXMgZGVmYXVsdCB2YWx1ZXMsXHJcbiAgICBhbmQgc29tZSBvcHRpb25hbCBpbml0aWFsVmFsdWVzLlxyXG4gICAgXHJcbiAgICBJdHMgbGlrZSBkZWZQcm9wZXJ0aWVzLCBidXQgZm9yIHBsYWluIGpzIHZhbHVlcyByYXRoZXIgdGhhbiBvYnNlcnZhYmxlcy5cclxuKiovXHJcbk1vZGVsLnByb3RvdHlwZS5kZWZGaWVsZHMgPSBmdW5jdGlvbiBkZWZGaWVsZHMoZmllbGRzLCBpbml0aWFsVmFsdWVzKSB7XHJcblxyXG4gICAgaW5pdGlhbFZhbHVlcyA9IGluaXRpYWxWYWx1ZXMgfHwge307XHJcblxyXG4gICAgdmFyIG1vZGVsT2JqZWN0ID0gdGhpcy5tb2RlbE9iamVjdCxcclxuICAgICAgICBmaWVsZHNMaXN0ID0gdGhpcy5maWVsZHNMaXN0O1xyXG5cclxuICAgIE9iamVjdC5rZXlzKGZpZWxkcykuZWFjaChmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgZGVmVmFsID0gZmllbGRzW2tleV07XHJcbiAgICAgICAgLy8gQ3JlYXRlIGZpZWxkIHdpdGggZGVmYXVsdCB2YWx1ZVxyXG4gICAgICAgIG1vZGVsT2JqZWN0W2tleV0gPSBkZWZWYWw7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgYW4gaW5pdGlhbFZhbHVlLCBzZXQgaXQ6XHJcbiAgICAgICAgaWYgKHR5cGVvZihpbml0aWFsVmFsdWVzW2tleV0pICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICBtb2RlbE9iamVjdFtrZXldID0gaW5pdGlhbFZhbHVlc1trZXldO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBBZGQgdG8gdGhlIGludGVybmFsIHJlZ2lzdHJ5XHJcbiAgICAgICAgZmllbGRzTGlzdC5wdXNoKGtleSk7XHJcbiAgICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgU3RvcmUgdGhlIGxpc3Qgb2YgZmllbGRzIHRoYXQgbWFrZSB0aGUgSUQvcHJpbWFyeSBrZXlcclxuICAgIGFuZCBjcmVhdGUgYW4gYWxpYXMgJ2lkJyBwcm9wZXJ0eSB0aGF0IHJldHVybnMgdGhlXHJcbiAgICB2YWx1ZSBmb3IgdGhlIElEIGZpZWxkIG9yIGFycmF5IG9mIHZhbHVlcyB3aGVuIG11bHRpcGxlXHJcbiAgICBmaWVsZHMuXHJcbioqL1xyXG5Nb2RlbC5wcm90b3R5cGUuZGVmSUQgPSBmdW5jdGlvbiBkZWZJRChmaWVsZHNOYW1lcykge1xyXG4gICAgXHJcbiAgICAvLyBTdG9yZSB0aGUgbGlzdFxyXG4gICAgdGhpcy5pZEZpZWxkc05hbWVzID0gZmllbGRzTmFtZXM7XHJcbiAgICBcclxuICAgIC8vIERlZmluZSBJRCBvYnNlcnZhYmxlXHJcbiAgICBpZiAoZmllbGRzTmFtZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgLy8gUmV0dXJucyBzaW5nbGUgdmFsdWVcclxuICAgICAgICB2YXIgZmllbGQgPSBmaWVsZHNOYW1lc1swXTtcclxuICAgICAgICB0aGlzLm1vZGVsT2JqZWN0LmlkID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1tmaWVsZF0oKTtcclxuICAgICAgICB9LCB0aGlzLm1vZGVsT2JqZWN0KTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHRoaXMubW9kZWxPYmplY3QuaWQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmaWVsZHNOYW1lcy5tYXAoZnVuY3Rpb24oZmllbGROYW1lKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1tmaWVsZE5hbWVdKCk7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICAgICAgfSwgdGhpcy5tb2RlbE9iamVjdCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICAgIEFsbG93cyB0byByZWdpc3RlciBhIHByb3BlcnR5IChwcmV2aW91c2x5IGRlZmluZWQpIGFzIFxyXG4gICAgdGhlIG1vZGVsIHRpbWVzdGFtcCwgc28gZ2V0cyB1cGRhdGVkIG9uIGFueSBkYXRhIGNoYW5nZVxyXG4gICAgKGtlZXAgaW4gc3luYyB3aXRoIHRoZSBpbnRlcm5hbCBkYXRhVGltZXN0YW1wKS5cclxuKiovXHJcbk1vZGVsLnByb3RvdHlwZS5yZWdUaW1lc3RhbXAgPSBmdW5jdGlvbiByZWdUaW1lc3RhbXBQcm9wZXJ0eShwcm9wZXJ0eU5hbWUpIHtcclxuXHJcbiAgICB2YXIgcHJvcCA9IHRoaXMubW9kZWxPYmplY3RbcHJvcGVydHlOYW1lXTtcclxuICAgIGlmICh0eXBlb2YocHJvcCkgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZXJlIGlzIG5vIG9ic2VydmFibGUgcHJvcGVydHkgd2l0aCBuYW1lIFsnICsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZSArIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnXSB0byByZWdpc3RlciBhcyB0aW1lc3RhbXAuJ1xyXG4gICAgICAgKTtcclxuICAgIH1cclxuICAgIC8vIEFkZCBzdWJzY3JpYmVyIG9uIGludGVybmFsIHRpbWVzdGFtcCB0byBrZWVwXHJcbiAgICAvLyB0aGUgcHJvcGVydHkgdXBkYXRlZFxyXG4gICAgdGhpcy5kYXRhVGltZXN0YW1wLnN1YnNjcmliZShmdW5jdGlvbih0aW1lc3RhbXApIHtcclxuICAgICAgICBwcm9wKHRpbWVzdGFtcCk7XHJcbiAgICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgUmV0dXJucyBhIHBsYWluIG9iamVjdCB3aXRoIHRoZSBwcm9wZXJ0aWVzIGFuZCBmaWVsZHNcclxuICAgIG9mIHRoZSBtb2RlbCBvYmplY3QsIGp1c3QgdmFsdWVzLlxyXG4gICAgXHJcbiAgICBAcGFyYW0gZGVlcENvcHk6Ym9vbCBJZiBsZWZ0IHVuZGVmaW5lZCwgZG8gbm90IGNvcHkgb2JqZWN0cyBpblxyXG4gICAgdmFsdWVzIGFuZCBub3QgcmVmZXJlbmNlcy4gSWYgZmFsc2UsIGRvIGEgc2hhbGxvdyBjb3B5LCBzZXR0aW5nXHJcbiAgICB1cCByZWZlcmVuY2VzIGluIHRoZSByZXN1bHQuIElmIHRydWUsIHRvIGEgZGVlcCBjb3B5IG9mIGFsbCBvYmplY3RzLlxyXG4qKi9cclxuTW9kZWwucHJvdG90eXBlLnRvUGxhaW5PYmplY3QgPSBmdW5jdGlvbiB0b1BsYWluT2JqZWN0KGRlZXBDb3B5KSB7XHJcblxyXG4gICAgdmFyIHBsYWluID0ge30sXHJcbiAgICAgICAgbW9kZWxPYmogPSB0aGlzLm1vZGVsT2JqZWN0O1xyXG5cclxuICAgIGZ1bmN0aW9uIHNldFZhbHVlKHByb3BlcnR5LCB2YWwpIHtcclxuICAgICAgICAvKmpzaGludCBtYXhjb21wbGV4aXR5OiAxMCovXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHR5cGVvZih2YWwpID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICBpZiAoZGVlcENvcHkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIGlmICh2YWwgaW5zdGFuY2VvZiBEYXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQSBkYXRlIGNsb25lXHJcbiAgICAgICAgICAgICAgICAgICAgcGxhaW5bcHJvcGVydHldID0gbmV3IERhdGUodmFsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZhbCAmJiB2YWwubW9kZWwgaW5zdGFuY2VvZiBNb2RlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEEgbW9kZWwgY29weVxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IHZhbC5tb2RlbC50b1BsYWluT2JqZWN0KGRlZXBDb3B5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZhbCA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBQbGFpbiAnc3RhbmRhcmQnIG9iamVjdCBjbG9uZVxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IGNsb25lKHZhbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoZGVlcENvcHkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBTaGFsbG93IGNvcHlcclxuICAgICAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IHZhbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBPbiBlbHNlLCBkbyBub3RoaW5nLCBubyByZWZlcmVuY2VzLCBubyBjbG9uZXNcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IHZhbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5wcm9wZXJ0aWVzTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHByb3BlcnR5KSB7XHJcbiAgICAgICAgLy8gUHJvcGVydGllcyBhcmUgb2JzZXJ2YWJsZXMsIHNvIGZ1bmN0aW9ucyB3aXRob3V0IHBhcmFtczpcclxuICAgICAgICB2YXIgdmFsID0gbW9kZWxPYmpbcHJvcGVydHldKCk7XHJcblxyXG4gICAgICAgIHNldFZhbHVlKHByb3BlcnR5LCB2YWwpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5maWVsZHNMaXN0LmZvckVhY2goZnVuY3Rpb24oZmllbGQpIHtcclxuICAgICAgICAvLyBGaWVsZHMgYXJlIGp1c3QgcGxhaW4gb2JqZWN0IG1lbWJlcnMgZm9yIHZhbHVlcywganVzdCBjb3B5OlxyXG4gICAgICAgIHZhciB2YWwgPSBtb2RlbE9ialtmaWVsZF07XHJcblxyXG4gICAgICAgIHNldFZhbHVlKGZpZWxkLCB2YWwpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHBsYWluO1xyXG59O1xyXG5cclxuTW9kZWwucHJvdG90eXBlLnVwZGF0ZVdpdGggPSBmdW5jdGlvbiB1cGRhdGVXaXRoKGRhdGEsIGRlZXBDb3B5KSB7XHJcbiAgICBcclxuICAgIC8vIFdlIG5lZWQgYSBwbGFpbiBvYmplY3QgZm9yICdmcm9tSlMnLlxyXG4gICAgLy8gSWYgaXMgYSBtb2RlbCwgZXh0cmFjdCB0aGVpciBwcm9wZXJ0aWVzIGFuZCBmaWVsZHMgZnJvbVxyXG4gICAgLy8gdGhlIG9ic2VydmFibGVzIChmcm9tSlMpLCBzbyB3ZSBub3QgZ2V0IGNvbXB1dGVkXHJcbiAgICAvLyBvciBmdW5jdGlvbnMsIGp1c3QgcmVnaXN0ZXJlZCBwcm9wZXJ0aWVzIGFuZCBmaWVsZHNcclxuICAgIHZhciB0aW1lc3RhbXAgPSBudWxsO1xyXG4gICAgaWYgKGRhdGEgJiYgZGF0YS5tb2RlbCBpbnN0YW5jZW9mIE1vZGVsKSB7XHJcblxyXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gc2V0IHRoZSBzYW1lIHRpbWVzdGFtcCwgc29cclxuICAgICAgICAvLyByZW1lbWJlciBmb3IgYWZ0ZXIgdGhlIGZyb21KU1xyXG4gICAgICAgIHRpbWVzdGFtcCA9IGRhdGEubW9kZWwuZGF0YVRpbWVzdGFtcCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFJlcGxhY2UgZGF0YSB3aXRoIGEgcGxhaW4gY29weSBvZiBpdHNlbGZcclxuICAgICAgICBkYXRhID0gZGF0YS5tb2RlbC50b1BsYWluT2JqZWN0KGRlZXBDb3B5KTtcclxuICAgIH1cclxuXHJcbiAgICBrby5tYXBwaW5nLmZyb21KUyhkYXRhLCB0aGlzLm1hcHBpbmdPcHRpb25zLCB0aGlzLm1vZGVsT2JqZWN0KTtcclxuICAgIC8vIFNhbWUgdGltZXN0YW1wIGlmIGFueVxyXG4gICAgaWYgKHRpbWVzdGFtcClcclxuICAgICAgICB0aGlzLm1vZGVsT2JqZWN0Lm1vZGVsLmRhdGFUaW1lc3RhbXAodGltZXN0YW1wKTtcclxufTtcclxuXHJcbk1vZGVsLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lKGRhdGEsIGRlZXBDb3B5KSB7XHJcbiAgICAvLyBHZXQgYSBwbGFpbiBvYmplY3Qgd2l0aCB0aGUgb2JqZWN0IGRhdGFcclxuICAgIHZhciBwbGFpbiA9IHRoaXMudG9QbGFpbk9iamVjdChkZWVwQ29weSk7XHJcbiAgICAvLyBDcmVhdGUgYSBuZXcgbW9kZWwgaW5zdGFuY2UsIHVzaW5nIHRoZSBzb3VyY2UgcGxhaW4gb2JqZWN0XHJcbiAgICAvLyBhcyBpbml0aWFsIHZhbHVlc1xyXG4gICAgdmFyIGNsb25lZCA9IG5ldyB0aGlzLm1vZGVsT2JqZWN0LmNvbnN0cnVjdG9yKHBsYWluKTtcclxuICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgLy8gVXBkYXRlIHRoZSBjbG9uZWQgd2l0aCB0aGUgcHJvdmlkZWQgcGxhaW4gZGF0YSB1c2VkXHJcbiAgICAgICAgLy8gdG8gcmVwbGFjZSB2YWx1ZXMgb24gdGhlIGNsb25lZCBvbmUsIGZvciBxdWljayBvbmUtc3RlcCBjcmVhdGlvblxyXG4gICAgICAgIC8vIG9mIGRlcml2ZWQgb2JqZWN0cy5cclxuICAgICAgICBjbG9uZWQubW9kZWwudXBkYXRlV2l0aChkYXRhKTtcclxuICAgIH1cclxuICAgIC8vIENsb25lZCBtb2RlbCByZWFkeTpcclxuICAgIHJldHVybiBjbG9uZWQ7XHJcbn07XHJcbiIsIi8qKiBQZXJmb3JtYW5jZVN1bW1hcnkgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIExpc3RWaWV3SXRlbSA9IHJlcXVpcmUoJy4vTGlzdFZpZXdJdGVtJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKSxcclxuICAgIG51bWVyYWwgPSByZXF1aXJlKCdudW1lcmFsJyk7XHJcblxyXG5mdW5jdGlvbiBQZXJmb3JtYW5jZVN1bW1hcnkodmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdmFsdWVzID0gdmFsdWVzIHx8IHt9O1xyXG5cclxuICAgIHRoaXMuZWFybmluZ3MgPSBuZXcgRWFybmluZ3ModmFsdWVzLmVhcm5pbmdzKTtcclxuICAgIFxyXG4gICAgdmFyIGVhcm5pbmdzTGluZSA9IG5ldyBMaXN0Vmlld0l0ZW0oKTtcclxuICAgIGVhcm5pbmdzTGluZS5tYXJrZXJMaW5lMSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBudW0gPSBudW1lcmFsKHRoaXMuY3VycmVudEFtb3VudCgpKS5mb3JtYXQoJyQwLDAnKTtcclxuICAgICAgICByZXR1cm4gbnVtO1xyXG4gICAgfSwgdGhpcy5lYXJuaW5ncyk7XHJcbiAgICBlYXJuaW5nc0xpbmUuY29udGVudExpbmUxID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudENvbmNlcHQoKTtcclxuICAgIH0sIHRoaXMuZWFybmluZ3MpO1xyXG4gICAgZWFybmluZ3NMaW5lLm1hcmtlckxpbmUyID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIG51bSA9IG51bWVyYWwodGhpcy5uZXh0QW1vdW50KCkpLmZvcm1hdCgnJDAsMCcpO1xyXG4gICAgICAgIHJldHVybiBudW07XHJcbiAgICB9LCB0aGlzLmVhcm5pbmdzKTtcclxuICAgIGVhcm5pbmdzTGluZS5jb250ZW50TGluZTIgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5uZXh0Q29uY2VwdCgpO1xyXG4gICAgfSwgdGhpcy5lYXJuaW5ncyk7XHJcbiAgICBcclxuXHJcbiAgICB0aGlzLnRpbWVCb29rZWQgPSBuZXcgVGltZUJvb2tlZCh2YWx1ZXMudGltZUJvb2tlZCk7XHJcblxyXG4gICAgdmFyIHRpbWVCb29rZWRMaW5lID0gbmV3IExpc3RWaWV3SXRlbSgpO1xyXG4gICAgdGltZUJvb2tlZExpbmUubWFya2VyTGluZTEgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgbnVtID0gbnVtZXJhbCh0aGlzLnBlcmNlbnQoKSkuZm9ybWF0KCcwJScpO1xyXG4gICAgICAgIHJldHVybiBudW07XHJcbiAgICB9LCB0aGlzLnRpbWVCb29rZWQpO1xyXG4gICAgdGltZUJvb2tlZExpbmUuY29udGVudExpbmUxID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uY2VwdCgpO1xyXG4gICAgfSwgdGhpcy50aW1lQm9va2VkKTtcclxuICAgIFxyXG4gICAgXHJcbiAgICB0aGlzLml0ZW1zID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBpdGVtcyA9IFtdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGl0ZW1zLnB1c2goZWFybmluZ3NMaW5lKTtcclxuICAgICAgICBpdGVtcy5wdXNoKHRpbWVCb29rZWRMaW5lKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGl0ZW1zO1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGVyZm9ybWFuY2VTdW1tYXJ5O1xyXG5cclxuZnVuY3Rpb24gRWFybmluZ3ModmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICBcclxuICAgICAgICAgY3VycmVudEFtb3VudDogMCxcclxuICAgICAgICAgY3VycmVudENvbmNlcHRUZW1wbGF0ZTogJ2FscmVhZHkgcGFpZCB0aGlzIG1vbnRoJyxcclxuICAgICAgICAgbmV4dEFtb3VudDogMCxcclxuICAgICAgICAgbmV4dENvbmNlcHRUZW1wbGF0ZTogJ3Byb2plY3RlZCB7bW9udGh9IGVhcm5pbmdzJ1xyXG5cclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuY3VycmVudENvbmNlcHQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHZhciBtb250aCA9IG1vbWVudCgpLmZvcm1hdCgnTU1NTScpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRDb25jZXB0VGVtcGxhdGUoKS5yZXBsYWNlKC9cXHttb250aFxcfS8sIG1vbnRoKTtcclxuXHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLm5leHRDb25jZXB0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgbW9udGggPSBtb21lbnQoKS5hZGQoMSwgJ21vbnRoJykuZm9ybWF0KCdNTU1NJyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dENvbmNlcHRUZW1wbGF0ZSgpLnJlcGxhY2UoL1xce21vbnRoXFx9LywgbW9udGgpO1xyXG5cclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBUaW1lQm9va2VkKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgXHJcbiAgICAgICAgcGVyY2VudDogMCxcclxuICAgICAgICBjb25jZXB0VGVtcGxhdGU6ICdvZiBhdmFpbGFibGUgdGltZSBib29rZWQgaW4ge21vbnRofSdcclxuICAgIFxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5jb25jZXB0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgbW9udGggPSBtb21lbnQoKS5hZGQoMSwgJ21vbnRoJykuZm9ybWF0KCdNTU1NJyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uY2VwdFRlbXBsYXRlKCkucmVwbGFjZSgvXFx7bW9udGhcXH0vLCBtb250aCk7XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuIiwiLyoqIFBvc2l0aW9uIG1vZGVsLlxyXG4gKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIFBvc2l0aW9uKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHBvc2l0aW9uSUQ6IDAsXHJcbiAgICAgICAgcG9zaXRpb25TaW5ndWxhcjogJycsXHJcbiAgICAgICAgcG9zaXRpb25QbHVyYWw6ICcnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnJyxcclxuICAgICAgICBhY3RpdmU6IHRydWVcclxuXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBvc2l0aW9uO1xyXG4iLCIvKipcclxuICAgIFByaWNpbmcgVHlwZSBtb2RlbFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gUHJpY2luZ1R5cGUodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHByaWNpbmdUeXBlSUQ6IDAsXHJcbiAgICAgICAgc2luZ3VsYXJOYW1lOiAnJyxcclxuICAgICAgICBwbHVyYWxOYW1lOiAnJyxcclxuICAgICAgICBzbHVnTmFtZTogJycsXHJcbiAgICAgICAgYWRkTmV3TGFiZWw6IG51bGwsXHJcbiAgICAgICAgZnJlZWxhbmNlckRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIC8vIFByaWNlQ2FsY3VsYXRpb25UeXBlIGVudW1lcmF0aW9uIHZhbHVlOlxyXG4gICAgICAgIHByaWNlQ2FsY3VsYXRpb246IG51bGwsXHJcbiAgICAgICAgaXNBZGRvbjogZmFsc2UsXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gRm9ybSBUZXh0c1xyXG4gICAgICAgIG5hbWVQbGFjZUhvbGRlcjogbnVsbCxcclxuICAgICAgICBzdWdnZXN0ZWROYW1lOiBudWxsLFxyXG4gICAgICAgIGZpeGVkTmFtZTogbnVsbCxcclxuICAgICAgICBkdXJhdGlvbkxhYmVsOiBudWxsLFxyXG4gICAgICAgIHByaWNlTGFiZWw6IG51bGwsXHJcbiAgICAgICAgcHJpY2VOb3RlOiBudWxsLFxyXG4gICAgICAgIGZpcnN0VGltZUNsaWVudHNPbmx5TGFiZWw6IG51bGwsXHJcbiAgICAgICAgZGVzY3JpcHRpb25QbGFjZUhvbGRlcjogbnVsbCxcclxuICAgICAgICBwcmljZVJhdGVRdWFudGl0eUxhYmVsOiBudWxsLFxyXG4gICAgICAgIHByaWNlUmF0ZVVuaXRMYWJlbDogbnVsbCxcclxuICAgICAgICBub1ByaWNlUmF0ZUxhYmVsOiBudWxsLFxyXG4gICAgICAgIG51bWJlck9mU2Vzc2lvbnNMYWJlbDogbnVsbCxcclxuICAgICAgICBpblBlcnNvblBob25lTGFiZWw6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQWN0aW9uIEFuZCBWYWxpZGF0aW9uIFRleHRzXHJcbiAgICAgICAgc3VjY2Vzc09uRGVsZXRlOiBudWxsLFxyXG4gICAgICAgIGVycm9yT25EZWxldGU6IG51bGwsXHJcbiAgICAgICAgc3VjY2Vzc09uU2F2ZTogbnVsbCxcclxuICAgICAgICBlcnJvck9uU2F2ZTogbnVsbCxcclxuICAgICAgICBwcmljZVJhdGVJc1JlcXVpcmVkVmFsaWRhdGlvbkVycm9yOiBudWxsLFxyXG4gICAgICAgIHByaWNlUmF0ZVVuaXRJc1JlcXVpcmVkVmFsaWRhdGlvbkVycm9yOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEhlbHAgVGV4dHNcclxuICAgICAgICBsZWFybk1vcmVMYWJlbDogbnVsbCxcclxuICAgICAgICBsZWFybk1vcmVUZXh0OiBudWxsLFxyXG4gICAgICAgIHByaWNlUmF0ZUxlYXJuTW9yZUxhYmVsOiBudWxsLFxyXG4gICAgICAgIHByaWNlUmF0ZUxlYXJuTW9yZVRleHQ6IG51bGwsXHJcbiAgICAgICAgbm9QcmljZVJhdGVMZWFybk1vcmVMYWJlbDogbnVsbCxcclxuICAgICAgICBub1ByaWNlUmF0ZUxlYXJuTW9yZVRleHQ6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQWRkaXRpb25hbCBjb25maWd1cmF0aW9uXHJcbiAgICAgICAgcmVxdWlyZUR1cmF0aW9uOiBmYWxzZSxcclxuICAgICAgICBpbmNsdWRlU2VydmljZUF0dHJpYnV0ZXM6IGZhbHNlLFxyXG4gICAgICAgIGluY2x1ZGVTcGVjaWFsUHJvbW90aW9uOiBmYWxzZSxcclxuICAgICAgICBcclxuICAgICAgICAvLyBMaXN0IFRleHRzXHJcbiAgICAgICAgLy8vIFN1bW1hcnlGb3JtYXQgaXMgdGhlIGRlZmF1bHQgZm9ybWF0IGZvciBzdW1tYXJpZXMgKHJlcXVpcmVkKSxcclxuICAgICAgICAvLy8gb3RoZXIgZm9ybWF0cyBhcmUgZ29vZCBmb3IgYmV0dGVyIGRldGFpbCwgYnV0IGRlcGVuZHNcclxuICAgICAgICAvLy8gb24gb3RoZXIgb3B0aW9ucyBjb25maWd1cmVkIHBlciB0eXBlLlxyXG4gICAgICAgIC8vLyBXaWxkY2FyZHM6XHJcbiAgICAgICAgLy8vIHswfTogZHVyYXRpb25cclxuICAgICAgICAvLy8gezF9OiBzZXNzaW9uc1xyXG4gICAgICAgIC8vLyB7Mn06IGlucGVyc29uL3Bob25lXHJcbiAgICAgICAgc3VtbWFyeUZvcm1hdDogbnVsbCxcclxuICAgICAgICBzdW1tYXJ5Rm9ybWF0TXVsdGlwbGVTZXNzaW9uczogbnVsbCxcclxuICAgICAgICBzdW1tYXJ5Rm9ybWF0Tm9EdXJhdGlvbjogbnVsbCxcclxuICAgICAgICBzdW1tYXJ5Rm9ybWF0TXVsdGlwbGVTZXNzaW9uc05vRHVyYXRpb246IG51bGwsXHJcbiAgICAgICAgd2l0aG91dFNlcnZpY2VBdHRyaWJ1dGVzQ3VzdG9tZXJNZXNzYWdlOiBudWxsLFxyXG4gICAgICAgIHdpdGhvdXRTZXJ2aWNlQXR0cmlidXRlc0ZyZWVsYW5jZXJNZXNzYWdlOiBudWxsLFxyXG4gICAgICAgIGZpcnN0VGltZUNsaWVudHNPbmx5TGlzdFRleHQ6IG51bGwsXHJcbiAgICAgICAgcHJpY2VSYXRlUXVhbnRpdHlMaXN0TGFiZWw6IG51bGwsXHJcbiAgICAgICAgcHJpY2VSYXRlVW5pdExpc3RMYWJlbDogbnVsbCxcclxuICAgICAgICBub1ByaWNlUmF0ZUxpc3RNZXNzYWdlOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEJvb2tpbmcvUHJpY2luZ0VzdGltYXRlIFRleHRzXHJcbiAgICAgICAgLy8vIE5hbWVBbmRTdW1tYXJ5Rm9ybWF0IGlzIHRoZSBkZWZhdWx0IGZvcm1hdCBmb3Igc3VtbWFyaWVzIHdpdGggcGFja2FnZSBuYW1lIChyZXF1aXJlZCksXHJcbiAgICAgICAgLy8vIG90aGVyIGZvcm1hdHMgYXJlIGdvb2QgZm9yIGJldHRlciBkZXRhaWwsIGJ1dCBkZXBlbmRzXHJcbiAgICAgICAgLy8vIG9uIG90aGVyIG9wdGlvbnMgY29uZmlndXJlZCBwZXIgdHlwZS5cclxuICAgICAgICAvLy8gV2lsZGNhcmRzOlxyXG4gICAgICAgIC8vLyB7MH06IHBhY2thZ2UgbmFtZVxyXG4gICAgICAgIC8vLyB7MX06IGR1cmF0aW9uXHJcbiAgICAgICAgLy8vIHsyfTogc2Vzc2lvbnNcclxuICAgICAgICAvLy8gezN9OiBpbnBlcnNvbi9waG9uZVxyXG4gICAgICAgIG5hbWVBbmRTdW1tYXJ5Rm9ybWF0OiBudWxsLFxyXG4gICAgICAgIG5hbWVBbmRTdW1tYXJ5Rm9ybWF0TXVsdGlwbGVTZXNzaW9uczogbnVsbCxcclxuICAgICAgICBuYW1lQW5kU3VtbWFyeUZvcm1hdE5vRHVyYXRpb246IG51bGwsXHJcbiAgICAgICAgbmFtZUFuZFN1bW1hcnlGb3JtYXRNdWx0aXBsZVNlc3Npb25zTm9EdXJhdGlvbjogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICAvLyBSZWNvcmQgbWFpbnRlbmFuY2VcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZJRChbJ3ByaWNpbmdUeXBlSUQnXSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUHJpY2luZ1R5cGU7XHJcblxyXG4vLyBFbnVtZXJhdGlvbjpcclxudmFyIFByaWNlQ2FsY3VsYXRpb25UeXBlID0ge1xyXG4gICAgRml4ZWRQcmljZTogMSxcclxuICAgIEhvdXJseVByaWNlOiAyXHJcbn07XHJcblxyXG5QcmljaW5nVHlwZS5QcmljZUNhbGN1bGF0aW9uVHlwZSA9IFByaWNlQ2FsY3VsYXRpb25UeXBlO1xyXG4iLCIvKipcclxuICAgIFByaXZhY3lTZXR0aW5ncyBtb2RlbFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gUHJpdmFjeVNldHRpbmdzKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICB1c2VySUQ6IDAsXHJcbiAgICAgICAgc21zQm9va2luZ0NvbW11bmljYXRpb246IGZhbHNlLFxyXG4gICAgICAgIHBob25lQm9va2luZ0NvbW11bmljYXRpb246IGZhbHNlLFxyXG4gICAgICAgIGxvY29ub21pY3NDb21tdW5pdHlDb21tdW5pY2F0aW9uOiBmYWxzZSxcclxuICAgICAgICBsb2Nvbm9taWNzRGJtQ2FtcGFpZ25zOiBmYWxzZSxcclxuICAgICAgICBwcm9maWxlU2VvUGVybWlzc2lvbjogZmFsc2UsXHJcbiAgICAgICAgbG9jb25vbWljc01hcmtldGluZ0NhbXBhaWduczogZmFsc2UsXHJcbiAgICAgICAgY29CcmFuZGVkUGFydG5lclBlcm1pc3Npb25zOiBmYWxzZSxcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZJRChbJ3VzZXJJRCddKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQcml2YWN5U2V0dGluZ3M7XHJcbiIsIi8qKlxyXG4gICAgU2NoZWR1bGluZ1ByZWZlcmVuY2VzIG1vZGVsLlxyXG4gKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIFNjaGVkdWxpbmdQcmVmZXJlbmNlcyh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBhZHZhbmNlVGltZTogMjQsXHJcbiAgICAgICAgYmV0d2VlblRpbWU6IDAsXHJcbiAgICAgICAgaW5jcmVtZW50c1NpemVJbk1pbnV0ZXM6IDE1XHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNjaGVkdWxpbmdQcmVmZXJlbmNlcztcclxuIiwiLyoqIFNlcnZpY2UgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIFNlcnZpY2UodmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgbmFtZTogJycsXHJcbiAgICAgICAgcHJpY2U6IDAsXHJcbiAgICAgICAgZHVyYXRpb246IDAsIC8vIGluIG1pbnV0ZXNcclxuICAgICAgICBpc0FkZG9uOiBmYWxzZVxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5kdXJhdGlvblRleHQgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgbWludXRlcyA9IHRoaXMuZHVyYXRpb24oKSB8fCAwO1xyXG4gICAgICAgIC8vIFRPRE86IEZvcm1hdHRpbmcsIGxvY2FsaXphdGlvblxyXG4gICAgICAgIHJldHVybiBtaW51dGVzID8gbWludXRlcyArICcgbWludXRlcycgOiAnJztcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNlcnZpY2U7XHJcbiIsIi8qKlxyXG4gICAgU2ltcGxpZmllZFdlZWtseVNjaGVkdWxlIG1vZGVsLlxyXG4gICAgXHJcbiAgICBJdHMgJ3NpbXBsaWZpZWQnIGJlY2F1c2UgaXQgcHJvdmlkZXMgYW4gQVBJXHJcbiAgICBmb3Igc2ltcGxlIHRpbWUgcmFuZ2UgcGVyIHdlZWsgZGF5LFxyXG4gICAgYSBwYWlyIG9mIGZyb20tdG8gdGltZXMuXHJcbiAgICBHb29kIGZvciBjdXJyZW50IHNpbXBsZSBVSS5cclxuICAgIFxyXG4gICAgVGhlIG9yaWdpbmFsIHdlZWtseSBzY2hlZHVsZSBkZWZpbmVzIHRoZSBzY2hlZHVsZVxyXG4gICAgaW4gMTUgbWludXRlcyBzbG90cywgc28gbXVsdGlwbGUgdGltZSByYW5nZXMgY2FuXHJcbiAgICBleGlzdHMgcGVyIHdlZWsgZGF5LCBqdXN0IG1hcmtpbmcgZWFjaCBzbG90XHJcbiAgICBhcyBhdmFpbGFibGUgb3IgdW5hdmFpbGFibGUuIFRoZSBBcHBNb2RlbFxyXG4gICAgd2lsbCBmaWxsIHRoaXMgbW9kZWwgaW5zdGFuY2VzIHByb3Blcmx5IG1ha2luZ1xyXG4gICAgYW55IGNvbnZlcnNpb24gZnJvbS90byB0aGUgc291cmNlIGRhdGEuXHJcbiAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuLyoqXHJcbiAgICBTdWJtb2RlbCB0aGF0IGlzIHVzZWQgb24gdGhlIFNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZVxyXG4gICAgZGVmaW5pbmcgYSBzaW5nbGUgd2VlayBkYXkgYXZhaWxhYmlsaXR5IHJhbmdlLlxyXG4gICAgQSBmdWxsIGRheSBtdXN0IGhhdmUgdmFsdWVzIGZyb206MCB0bzoxNDQwLCBuZXZlclxyXG4gICAgYm90aCBhcyB6ZXJvIGJlY2F1c2UgdGhhdHMgY29uc2lkZXJlZCBhcyBub3QgYXZhaWxhYmxlLFxyXG4gICAgc28gaXMgYmV0dGVyIHRvIHVzZSB0aGUgaXNBbGxEYXkgcHJvcGVydHkuXHJcbioqL1xyXG5mdW5jdGlvbiBXZWVrRGF5U2NoZWR1bGUodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIC8vIE5PVEU6IGZyb20tdG8gcHJvcGVyaWVzIGFzIG51bWJlcnNcclxuICAgIC8vIGZvciB0aGUgbWludXRlIG9mIHRoZSBkYXksIGZyb20gMCAoMDA6MDApIHRvIDE0MzkgKDIzOjU5KVxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBmcm9tOiAwLFxyXG4gICAgICAgIHRvOiAwXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBJdCBhbGxvd3MgdG8ga25vdyBpZiB0aGlzIHdlZWsgZGF5IGlzIFxyXG4gICAgICAgIGVuYWJsZWQgZm9yIHdlZWtseSBzY2hlZHVsZSwganVzdCBpdFxyXG4gICAgICAgIGhhcyBmcm9tLXRvIHRpbWVzLlxyXG4gICAgICAgIEl0IGFsbG93cyB0byBiZSBzZXQgYXMgdHJ1ZSBwdXR0aW5nXHJcbiAgICAgICAgYSBkZWZhdWx0IHJhbmdlICg5YS01cCkgb3IgZmFsc2UgXHJcbiAgICAgICAgc2V0dGluZyBib3RoIGFzIDBwLlxyXG4gICAgICAgIFxyXG4gICAgICAgIFNpbmNlIG9uIHdyaXRlIHR3byBvYnNlcnZhYmxlcyBhcmUgYmVpbmcgbW9kaWZpZWQsIGFuZFxyXG4gICAgICAgIGJvdGggYXJlIHVzZWQgaW4gdGhlIHJlYWQsIGEgc2luZ2xlIGNoYW5nZSB0byB0aGUgXHJcbiAgICAgICAgdmFsdWUgd2lsbCB0cmlnZ2VyIHR3byBub3RpZmljYXRpb25zOyB0byBhdm9pZCB0aGF0LFxyXG4gICAgICAgIHRoZSBvYnNlcnZhYmxlIGlzIHJhdGUgbGltaXRlZCB3aXRoIGFuIGlubWVkaWF0ZSB2YWx1ZSxcclxuICAgICAgICBzb24gb25seSBvbmUgbm90aWZpY2F0aW9uIGlzIHJlY2VpdmVkLlxyXG4gICAgKiovXHJcbiAgICB0aGlzLmlzRW5hYmxlZCA9IGtvLmNvbXB1dGVkKHtcclxuICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIHR5cGVvZih0aGlzLmZyb20oKSkgPT09ICdudW1iZXInICYmXHJcbiAgICAgICAgICAgICAgICB0eXBlb2YodGhpcy50bygpKSA9PT0gJ251bWJlcicgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMuZnJvbSgpIDwgdGhpcy50bygpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB3cml0ZTogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWwgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIC8vIERlZmF1bHQgcmFuZ2UgOWEgLSA1cFxyXG4gICAgICAgICAgICAgICAgdGhpcy5mcm9tSG91cig5KTtcclxuICAgICAgICAgICAgICAgIHRoaXMudG9Ib3VyKDE3KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudG9Ib3VyKDApO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mcm9tKDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvd25lcjogdGhpc1xyXG4gICAgfSkuZXh0ZW5kKHsgcmF0ZUxpbWl0OiAwIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLmlzQWxsRGF5ID0ga28uY29tcHV0ZWQoe1xyXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gIChcclxuICAgICAgICAgICAgICAgIHRoaXMuZnJvbSgpID09PSAwICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvKCkgPT09IDE0NDBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHdyaXRlOiBmdW5jdGlvbigvKnZhbCovKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJvbSgwKTtcclxuICAgICAgICAgICAgdGhpcy50bygxNDQwKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG93bmVyOiB0aGlzXHJcbiAgICB9KS5leHRlbmQoeyByYXRlTGltaXQ6IDAgfSk7XHJcbiAgICBcclxuICAgIC8vIEFkZGl0aW9uYWwgaW50ZXJmYWNlcyB0byBnZXQvc2V0IHRoZSBmcm9tL3RvIHRpbWVzXHJcbiAgICAvLyBieSB1c2luZyBhIGRpZmZlcmVudCBkYXRhIHVuaXQgb3IgZm9ybWF0LlxyXG4gICAgXHJcbiAgICAvLyBJbnRlZ2VyLCByb3VuZGVkLXVwLCBudW1iZXIgb2YgaG91cnNcclxuICAgIHRoaXMuZnJvbUhvdXIgPSBrby5jb21wdXRlZCh7XHJcbiAgICAgICAgcmVhZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKHRoaXMuZnJvbSgpIC8gNjApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKGhvdXJzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJvbSgoaG91cnMgKiA2MCkgfDApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3duZXI6IHRoaXNcclxuICAgIH0pO1xyXG4gICAgdGhpcy50b0hvdXIgPSBrby5jb21wdXRlZCh7XHJcbiAgICAgICAgcmVhZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmNlaWwodGhpcy50bygpIC8gNjApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKGhvdXJzKSB7XHJcbiAgICAgICAgICAgIHRoaXMudG8oKGhvdXJzICogNjApIHwwKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG93bmVyOiB0aGlzXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gU3RyaW5nLCB0aW1lIGZvcm1hdCAoJ2hoOm1tJylcclxuICAgIHRoaXMuZnJvbVRpbWUgPSBrby5jb21wdXRlZCh7XHJcbiAgICAgICAgcmVhZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBtaW51dGVzVG9UaW1lU3RyaW5nKHRoaXMuZnJvbSgpIHwwKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHdyaXRlOiBmdW5jdGlvbih0aW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJvbSh0aW1lU3RyaW5nVG9NaW51dGVzKHRpbWUpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG93bmVyOiB0aGlzXHJcbiAgICB9KTtcclxuICAgIHRoaXMudG9UaW1lID0ga28uY29tcHV0ZWQoe1xyXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbWludXRlc1RvVGltZVN0cmluZyh0aGlzLnRvKCkgfDApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKHRpbWUpIHtcclxuICAgICAgICAgICAgdGhpcy50byh0aW1lU3RyaW5nVG9NaW51dGVzKHRpbWUpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG93bmVyOiB0aGlzXHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAgICBNYWluIG1vZGVsIGRlZmluaW5nIHRoZSB3ZWVrIHNjaGVkdWxlXHJcbiAgICBwZXIgd2VlayBkYXRlLCBvciBqdXN0IHNldCBhbGwgZGF5cyB0aW1lc1xyXG4gICAgYXMgYXZhaWxhYmxlIHdpdGggYSBzaW5nbGUgZmxhZy5cclxuKiovXHJcbmZ1bmN0aW9uIFNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBzdW5kYXk6IG5ldyBXZWVrRGF5U2NoZWR1bGUoKSxcclxuICAgICAgICBtb25kYXk6IG5ldyBXZWVrRGF5U2NoZWR1bGUoKSxcclxuICAgICAgICB0dWVzZGF5OiBuZXcgV2Vla0RheVNjaGVkdWxlKCksXHJcbiAgICAgICAgd2VkbmVzZGF5OiBuZXcgV2Vla0RheVNjaGVkdWxlKCksXHJcbiAgICAgICAgdGh1cnNkYXk6IG5ldyBXZWVrRGF5U2NoZWR1bGUoKSxcclxuICAgICAgICBmcmlkYXk6IG5ldyBXZWVrRGF5U2NoZWR1bGUoKSxcclxuICAgICAgICBzYXR1cmRheTogbmV3IFdlZWtEYXlTY2hlZHVsZSgpLFxyXG4gICAgICAgIGlzQWxsVGltZTogZmFsc2VcclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2ltcGxpZmllZFdlZWtseVNjaGVkdWxlO1xyXG5cclxuLy8vLyBVVElMUyxcclxuLy8gVE9ETyBPcmdhbml6ZSBvciBleHRlcm5hbGl6ZS4gc29tZSBjb3BpZWQgZm9ybSBhcHBtb2RlbC4uXHJcbi8qKlxyXG4gICAgaW50ZXJuYWwgdXRpbGl0eSBmdW5jdGlvbiAndG8gc3RyaW5nIHdpdGggdHdvIGRpZ2l0cyBhbG1vc3QnXHJcbioqL1xyXG5mdW5jdGlvbiB0d29EaWdpdHMobikge1xyXG4gICAgcmV0dXJuIE1hdGguZmxvb3IobiAvIDEwKSArICcnICsgbiAlIDEwO1xyXG59XHJcblxyXG4vKipcclxuICAgIENvbnZlcnQgYSBudW1iZXIgb2YgbWludXRlc1xyXG4gICAgaW4gYSBzdHJpbmcgbGlrZTogMDA6MDA6MDAgKGhvdXJzOm1pbnV0ZXM6c2Vjb25kcylcclxuKiovXHJcbmZ1bmN0aW9uIG1pbnV0ZXNUb1RpbWVTdHJpbmcobWludXRlcykge1xyXG4gICAgdmFyIGQgPSBtb21lbnQuZHVyYXRpb24obWludXRlcywgJ21pbnV0ZXMnKSxcclxuICAgICAgICBoID0gZC5ob3VycygpLFxyXG4gICAgICAgIG0gPSBkLm1pbnV0ZXMoKSxcclxuICAgICAgICBzID0gZC5zZWNvbmRzKCk7XHJcbiAgICBcclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgdHdvRGlnaXRzKGgpICsgJzonICtcclxuICAgICAgICB0d29EaWdpdHMobSkgKyAnOicgK1xyXG4gICAgICAgIHR3b0RpZ2l0cyhzKVxyXG4gICAgKTtcclxufVxyXG5cclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5mdW5jdGlvbiB0aW1lU3RyaW5nVG9NaW51dGVzKHRpbWUpIHtcclxuICAgIHJldHVybiBtb21lbnQuZHVyYXRpb24odGltZSkuYXNNaW51dGVzKCkgfDA7XHJcbn0iLCIvKiogVXBjb21pbmdCb29raW5nc1N1bW1hcnkgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIEJvb2tpbmdTdW1tYXJ5ID0gcmVxdWlyZSgnLi9Cb29raW5nU3VtbWFyeScpO1xyXG5cclxuZnVuY3Rpb24gVXBjb21pbmdCb29raW5nc1N1bW1hcnkoKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy50b2RheSA9IG5ldyBCb29raW5nU3VtbWFyeSh7XHJcbiAgICAgICAgY29uY2VwdDogJ21vcmUgdG9kYXknLFxyXG4gICAgICAgIHRpbWVGb3JtYXQ6ICcgW2VuZGluZyBAXSBoOm1tYSdcclxuICAgIH0pO1xyXG4gICAgdGhpcy50b21vcnJvdyA9IG5ldyBCb29raW5nU3VtbWFyeSh7XHJcbiAgICAgICAgY29uY2VwdDogJ3RvbW9ycm93JyxcclxuICAgICAgICB0aW1lRm9ybWF0OiAnIFtzdGFydGluZyBAXSBoOm1tYSdcclxuICAgIH0pO1xyXG4gICAgdGhpcy5uZXh0V2VlayA9IG5ldyBCb29raW5nU3VtbWFyeSh7XHJcbiAgICAgICAgY29uY2VwdDogJ25leHQgd2VlaycsXHJcbiAgICAgICAgdGltZUZvcm1hdDogbnVsbFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMuaXRlbXMgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGl0ZW1zID0gW107XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9pZiAodGhpcy50b2RheS5xdWFudGl0eSgpKVxyXG4gICAgICAgIGl0ZW1zLnB1c2godGhpcy50b2RheSk7XHJcbiAgICAgICAgLy9pZiAodGhpcy50b21vcnJvdy5xdWFudGl0eSgpKVxyXG4gICAgICAgIGl0ZW1zLnB1c2godGhpcy50b21vcnJvdyk7XHJcbiAgICAgICAgLy9pZiAodGhpcy5uZXh0V2Vlay5xdWFudGl0eSgpKVxyXG4gICAgICAgIGl0ZW1zLnB1c2godGhpcy5uZXh0V2Vlayk7XHJcblxyXG4gICAgICAgIHJldHVybiBpdGVtcztcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVXBjb21pbmdCb29raW5nc1N1bW1hcnk7XHJcbiIsIi8qKiBVc2VyIG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG4vLyBFbnVtIFVzZXJUeXBlXHJcbnZhciBVc2VyVHlwZSA9IHtcclxuICAgIE5vbmU6IDAsXHJcbiAgICBBbm9ueW1vdXM6IDEsXHJcbiAgICBDdXN0b21lcjogMixcclxuICAgIEZyZWVsYW5jZXI6IDQsXHJcbiAgICBBZG1pbjogOCxcclxuICAgIExvZ2dlZFVzZXI6IDE0LFxyXG4gICAgVXNlcjogMTUsXHJcbiAgICBTeXN0ZW06IDE2XHJcbn07XHJcblxyXG5mdW5jdGlvbiBVc2VyKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICB1c2VySUQ6IDAsXHJcbiAgICAgICAgZW1haWw6ICcnLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGZpcnN0TmFtZTogJycsXHJcbiAgICAgICAgbGFzdE5hbWU6ICcnLFxyXG4gICAgICAgIHNlY29uZExhc3ROYW1lOiAnJyxcclxuICAgICAgICBidXNpbmVzc05hbWU6ICcnLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGFsdGVybmF0aXZlRW1haWw6ICcnLFxyXG4gICAgICAgIHBob25lOiAnJyxcclxuICAgICAgICBjYW5SZWNlaXZlU21zOiAnJyxcclxuICAgICAgICBiaXJ0aE1vbnRoRGF5OiBudWxsLFxyXG4gICAgICAgIGJpcnRoTW9udGg6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgaXNGcmVlbGFuY2VyOiBmYWxzZSxcclxuICAgICAgICBpc0N1c3RvbWVyOiBmYWxzZSxcclxuICAgICAgICBpc01lbWJlcjogZmFsc2UsXHJcbiAgICAgICAgaXNBZG1pbjogZmFsc2UsXHJcblxyXG4gICAgICAgIG9uYm9hcmRpbmdTdGVwOiBudWxsLFxyXG4gICAgICAgIGFjY291bnRTdGF0dXNJRDogMCxcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxuXHJcbiAgICB0aGlzLmZ1bGxOYW1lID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBuYW1lUGFydHMgPSBbdGhpcy5maXJzdE5hbWUoKV07XHJcbiAgICAgICAgaWYgKHRoaXMubGFzdE5hbWUoKSlcclxuICAgICAgICAgICAgbmFtZVBhcnRzLnB1c2godGhpcy5sYXN0TmFtZSgpKTtcclxuICAgICAgICBpZiAodGhpcy5zZWNvbmRMYXN0TmFtZSgpKVxyXG4gICAgICAgICAgICBuYW1lUGFydHMucHVzaCh0aGlzLnNlY29uZExhc3ROYW1lKTtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbmFtZVBhcnRzLmpvaW4oJyAnKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmJpcnRoRGF5ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmJpcnRoTW9udGhEYXkoKSAmJlxyXG4gICAgICAgICAgICB0aGlzLmJpcnRoTW9udGgoKSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVE9ETyBpMTBuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJpcnRoTW9udGgoKSArICcvJyArIHRoaXMuYmlydGhNb250aERheSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMudXNlclR5cGUgPSBrby5wdXJlQ29tcHV0ZWQoe1xyXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgYyA9IHRoaXMuaXNDdXN0b21lcigpLFxyXG4gICAgICAgICAgICAgICAgcCA9IHRoaXMuaXNGcmVlbGFuY2VyKCksXHJcbiAgICAgICAgICAgICAgICBhID0gdGhpcy5pc0FkbWluKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgdXNlclR5cGUgPSAwO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBbm9ueW1vdXMoKSlcclxuICAgICAgICAgICAgICAgIHVzZXJUeXBlID0gdXNlclR5cGUgfCBVc2VyVHlwZS5Bbm9ueW1vdXM7XHJcbiAgICAgICAgICAgIGlmIChjKVxyXG4gICAgICAgICAgICAgICAgdXNlclR5cGUgPSB1c2VyVHlwZSB8IFVzZXJUeXBlLkN1c3RvbWVyO1xyXG4gICAgICAgICAgICBpZiAocClcclxuICAgICAgICAgICAgICAgIHVzZXJUeXBlID0gdXNlclR5cGUgfCBVc2VyVHlwZS5GcmVlbGFuY2VyO1xyXG4gICAgICAgICAgICBpZiAoYSlcclxuICAgICAgICAgICAgICAgIHVzZXJUeXBlID0gdXNlclR5cGUgfCBVc2VyVHlwZS5BZG1pbjtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiB1c2VyVHlwZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qIE5PVEU6IE5vdCByZXF1aXJlZCBmb3Igbm93OlxyXG4gICAgICAgIHdyaXRlOiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgfSwqL1xyXG4gICAgICAgIG93bmVyOiB0aGlzXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgdGhpcy5pc0Fub255bW91cyA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLnVzZXJJRCgpIDwgMTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBJdCBtYXRjaGVzIGEgVXNlclR5cGUgZnJvbSB0aGUgZW51bWVyYXRpb24/XHJcbiAgICAqKi9cclxuICAgIHRoaXMuaXNVc2VyVHlwZSA9IGZ1bmN0aW9uIGlzVXNlclR5cGUodHlwZSkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy51c2VyVHlwZSgpICYgdHlwZSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVXNlcjtcclxuXHJcblVzZXIuVXNlclR5cGUgPSBVc2VyVHlwZTtcclxuXHJcbi8qIENyZWF0aW50IGFuIGFub255bW91cyB1c2VyIHdpdGggc29tZSBwcmVzc2V0cyAqL1xyXG5Vc2VyLm5ld0Fub255bW91cyA9IGZ1bmN0aW9uIG5ld0Fub255bW91cygpIHtcclxuICAgIHJldHVybiBuZXcgVXNlcih7XHJcbiAgICAgICAgdXNlcklEOiAwLFxyXG4gICAgICAgIGVtYWlsOiAnJyxcclxuICAgICAgICBmaXJzdE5hbWU6ICcnLFxyXG4gICAgICAgIG9uYm9hcmRpbmdTdGVwOiBudWxsXHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBVc2VySm9iVGl0bGUgbW9kZWwsIHJlbGF0aW9uc2hpcCBiZXR3ZWVuIGFuIHVzZXIgYW5kIGFcclxuICAgIGpvYiB0aXRsZSBhbmQgdGhlIG1haW4gZGF0YSBhdHRhY2hlZCB0byB0aGF0IHJlbGF0aW9uLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gVXNlckpvYlRpdGxlKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICB1c2VySUQ6IDAsXHJcbiAgICAgICAgam9iVGl0bGVJRDogMCxcclxuICAgICAgICBpbnRybzogbnVsbCxcclxuICAgICAgICBzdGF0dXNJRDogMCxcclxuICAgICAgICBjYW5jZWxsYXRpb25Qb2xpY3lJRDogMCxcclxuICAgICAgICBpbnN0YW50Qm9va2luZzogZmFsc2UsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGxcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmSUQoWyd1c2VySUQnLCAnam9iVGl0bGVJRCddKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBVc2VySm9iVGl0bGU7XHJcbiIsIi8qKiBDbGllbnRzIHRlc3QgZGF0YSAqKi9cclxudmFyIENsaWVudCA9IHJlcXVpcmUoJy4uL21vZGVscy9DbGllbnQnKTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IFtcclxuICAgIG5ldyBDbGllbnQgKHtcclxuICAgICAgICBpZDogMSxcclxuICAgICAgICBmaXJzdE5hbWU6ICdKb3NodWEnLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRGFuaWVsc29uJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBpZDogMixcclxuICAgICAgICBmaXJzdE5hbWU6ICdJYWdvJyxcclxuICAgICAgICBsYXN0TmFtZTogJ0xvcmVuem8nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiAzLFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0Zlcm5hbmRvJyxcclxuICAgICAgICBsYXN0TmFtZTogJ0dhZ28nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiA0LFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FkYW0nLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRmluY2gnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiA1LFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FsYW4nLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRmVyZ3Vzb24nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiA2LFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FsZXgnLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnUGVuYSdcclxuICAgIH0pLFxyXG4gICAgbmV3IENsaWVudCh7XHJcbiAgICAgICAgaWQ6IDcsXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnQWxleGlzJyxcclxuICAgICAgICBsYXN0TmFtZTogJ1BlYWNhJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBpZDogOCxcclxuICAgICAgICBmaXJzdE5hbWU6ICdBcnRodXInLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnTWlsbGVyJ1xyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMuY2xpZW50cyA9IHRlc3REYXRhO1xyXG4iLCIvKiogTG9jYXRpb25zIHRlc3QgZGF0YSAqKi9cclxudmFyIExvY2F0aW9uID0gcmVxdWlyZSgnLi4vbW9kZWxzL0xvY2F0aW9uJyk7XHJcblxyXG52YXIgdGVzdERhdGEgPSBbXHJcbiAgICBuZXcgTG9jYXRpb24gKHtcclxuICAgICAgICBsb2NhdGlvbklEOiAxLFxyXG4gICAgICAgIG5hbWU6ICdBY3R2aVNwYWNlJyxcclxuICAgICAgICBhZGRyZXNzTGluZTE6ICczMTUwIDE4dGggU3RyZWV0JyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwMSxcclxuICAgICAgICBpc1NlcnZpY2VSYWRpdXM6IHRydWUsXHJcbiAgICAgICAgc2VydmljZVJhZGl1czogMlxyXG4gICAgfSksXHJcbiAgICBuZXcgTG9jYXRpb24oe1xyXG4gICAgICAgIGxvY2F0aW9uSUQ6IDIsXHJcbiAgICAgICAgbmFtZTogJ0NvcmV5XFwncyBBcHQnLFxyXG4gICAgICAgIGFkZHJlc3NMaW5lMTogJzE4NyBCb2NhbmEgU3QuJyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwMlxyXG4gICAgfSksXHJcbiAgICBuZXcgTG9jYXRpb24oe1xyXG4gICAgICAgIGxvY2F0aW9uSUQ6IDMsXHJcbiAgICAgICAgbmFtZTogJ0pvc2hcXCdhIEFwdCcsXHJcbiAgICAgICAgYWRkcmVzc0xpbmUxOiAnNDI5IENvcmJldHQgQXZlJyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwM1xyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMubG9jYXRpb25zID0gdGVzdERhdGE7XHJcbiIsIi8qKiBJbmJveCB0ZXN0IGRhdGEgKiovXHJcbnZhciBNZXNzYWdlID0gcmVxdWlyZSgnLi4vbW9kZWxzL01lc3NhZ2UnKTtcclxuXHJcbnZhciBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xyXG4vL3ZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbnZhciB0b2RheSA9IG5ldyBEYXRlKCksXHJcbiAgICB5ZXN0ZXJkYXkgPSBuZXcgRGF0ZSgpLFxyXG4gICAgbGFzdFdlZWsgPSBuZXcgRGF0ZSgpLFxyXG4gICAgb2xkRGF0ZSA9IG5ldyBEYXRlKCk7XHJcbnllc3RlcmRheS5zZXREYXRlKHllc3RlcmRheS5nZXREYXRlKCkgLSAxKTtcclxubGFzdFdlZWsuc2V0RGF0ZShsYXN0V2Vlay5nZXREYXRlKCkgLSAyKTtcclxub2xkRGF0ZS5zZXREYXRlKG9sZERhdGUuZ2V0RGF0ZSgpIC0gMTYpO1xyXG5cclxudmFyIHRlc3REYXRhID0gW1xyXG4gICAgbmV3IE1lc3NhZ2Uoe1xyXG4gICAgICAgIGlkOiAxLFxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBuZXcgVGltZSh0b2RheSwgMTEsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdDT05GSVJNLVN1c2FuIERlZScsXHJcbiAgICAgICAgY29udGVudDogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UnLFxyXG4gICAgICAgIGxpbms6ICcvY29udmVyc2F0aW9uLzEnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6ICckNzAnLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXdhcm5pbmcnXHJcbiAgICB9KSxcclxuICAgIG5ldyBNZXNzYWdlKHtcclxuICAgICAgICBpZDogMyxcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbmV3IFRpbWUoeWVzdGVyZGF5LCAxMywgMCwgMCksXHJcblxyXG4gICAgICAgIHN1YmplY3Q6ICdEbyB5b3UgZG8gXCJFeG90aWMgTWFzc2FnZVwiPycsXHJcbiAgICAgICAgY29udGVudDogJ0hpLCBJIHdhbnRlZCB0byBrbm93IGlmIHlvdSBwZXJmb3JtIGFzIHBhciBvZiB5b3VyIHNlcnZpY2VzLi4uJyxcclxuICAgICAgICBsaW5rOiAnL2NvbnZlcnNhdGlvbi8zJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tc2hhcmUtYWx0JyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KSxcclxuICAgIG5ldyBNZXNzYWdlKHtcclxuICAgICAgICBpZDogMixcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbmV3IFRpbWUobGFzdFdlZWssIDEyLCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnSm9zaCBEYW5pZWxzb24nLFxyXG4gICAgICAgIGNvbnRlbnQ6ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBsaW5rOiAnL2NvbnZlcnNhdGlvbi8yJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgTWVzc2FnZSh7XHJcbiAgICAgICAgaWQ6IDQsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG5ldyBUaW1lKG9sZERhdGUsIDE1LCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnSW5xdWlyeScsXHJcbiAgICAgICAgY29udGVudDogJ0Fub3RoZXIgcXVlc3Rpb24gZnJvbSBhbm90aGVyIGNsaWVudC4nLFxyXG4gICAgICAgIGxpbms6ICcvY29udmVyc2F0aW9uLzQnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1zaGFyZS1hbHQnLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KVxyXG5dO1xyXG5cclxuZXhwb3J0cy5tZXNzYWdlcyA9IHRlc3REYXRhO1xyXG4iLCIvKiogU2VydmljZXMgdGVzdCBkYXRhICoqL1xyXG52YXIgU2VydmljZSA9IHJlcXVpcmUoJy4uL21vZGVscy9TZXJ2aWNlJyk7XHJcblxyXG52YXIgdGVzdERhdGEgPSBbXHJcbiAgICBuZXcgU2VydmljZSAoe1xyXG4gICAgICAgIG5hbWU6ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBwcmljZTogOTUsXHJcbiAgICAgICAgZHVyYXRpb246IDEyMFxyXG4gICAgfSksXHJcbiAgICBuZXcgU2VydmljZSh7XHJcbiAgICAgICAgbmFtZTogJ1Rpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBwcmljZTogNjAsXHJcbiAgICAgICAgZHVyYXRpb246IDYwXHJcbiAgICB9KSxcclxuICAgIG5ldyBTZXJ2aWNlKHtcclxuICAgICAgICBuYW1lOiAnU3BlY2lhbCBvaWxzJyxcclxuICAgICAgICBwcmljZTogOTUsXHJcbiAgICAgICAgaXNBZGRvbjogdHJ1ZVxyXG4gICAgfSksXHJcbiAgICBuZXcgU2VydmljZSh7XHJcbiAgICAgICAgbmFtZTogJ1NvbWUgc2VydmljZSBleHRyYScsXHJcbiAgICAgICAgcHJpY2U6IDQwLFxyXG4gICAgICAgIGR1cmF0aW9uOiAyMCxcclxuICAgICAgICBpc0FkZG9uOiB0cnVlXHJcbiAgICB9KVxyXG5dO1xyXG5cclxuZXhwb3J0cy5zZXJ2aWNlcyA9IHRlc3REYXRhO1xyXG4iLCIvKiogXHJcbiAgICB0aW1lU2xvdHNcclxuICAgIHRlc3RpbmcgZGF0YVxyXG4qKi9cclxuXHJcbnZhciBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xyXG5cclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxudmFyIHRvZGF5ID0gbmV3IERhdGUoKSxcclxuICAgIHRvbW9ycm93ID0gbmV3IERhdGUoKTtcclxudG9tb3Jyb3cuc2V0RGF0ZSh0b21vcnJvdy5nZXREYXRlKCkgKyAxKTtcclxuXHJcbnZhciBzdG9kYXkgPSBtb21lbnQodG9kYXkpLmZvcm1hdCgnWVlZWS1NTS1ERCcpLFxyXG4gICAgc3RvbW9ycm93ID0gbW9tZW50KHRvbW9ycm93KS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcclxuXHJcbnZhciB0ZXN0RGF0YTEgPSBbXHJcbiAgICBUaW1lKHRvZGF5LCA5LCAxNSksXHJcbiAgICBUaW1lKHRvZGF5LCAxMSwgMzApLFxyXG4gICAgVGltZSh0b2RheSwgMTIsIDApLFxyXG4gICAgVGltZSh0b2RheSwgMTIsIDMwKSxcclxuICAgIFRpbWUodG9kYXksIDE2LCAxNSksXHJcbiAgICBUaW1lKHRvZGF5LCAxOCwgMCksXHJcbiAgICBUaW1lKHRvZGF5LCAxOCwgMzApLFxyXG4gICAgVGltZSh0b2RheSwgMTksIDApLFxyXG4gICAgVGltZSh0b2RheSwgMTksIDMwKSxcclxuICAgIFRpbWUodG9kYXksIDIxLCAzMCksXHJcbiAgICBUaW1lKHRvZGF5LCAyMiwgMClcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YTIgPSBbXHJcbiAgICBUaW1lKHRvbW9ycm93LCA4LCAwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEwLCAzMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMSwgMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMSwgMzApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTIsIDApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTIsIDMwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEzLCAwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEzLCAzMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxNCwgNDUpLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTYsIDApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTYsIDMwKVxyXG5dO1xyXG5cclxudmFyIHRlc3REYXRhQnVzeSA9IFtcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IHtcclxuICAgICdkZWZhdWx0JzogdGVzdERhdGFCdXN5XHJcbn07XHJcbnRlc3REYXRhW3N0b2RheV0gPSB0ZXN0RGF0YTE7XHJcbnRlc3REYXRhW3N0b21vcnJvd10gPSB0ZXN0RGF0YTI7XHJcblxyXG5leHBvcnRzLnRpbWVTbG90cyA9IHRlc3REYXRhO1xyXG4iLCIvKipcclxuICAgIFV0aWxpdHkgdG8gaGVscCB0cmFjayB0aGUgc3RhdGUgb2YgY2FjaGVkIGRhdGFcclxuICAgIG1hbmFnaW5nIHRpbWUsIHByZWZlcmVuY2UgYW5kIGlmIG11c3QgYmUgcmV2YWxpZGF0ZWRcclxuICAgIG9yIG5vdC5cclxuICAgIFxyXG4gICAgSXRzIGp1c3QgbWFuYWdlcyBtZXRhIGRhdGEsIGJ1dCBub3QgdGhlIGRhdGEgdG8gYmUgY2FjaGVkLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxuZnVuY3Rpb24gQ2FjaGVDb250cm9sKG9wdGlvbnMpIHtcclxuICAgIFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgLy8gQSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIG9yXHJcbiAgICAvLyBBbiBvYmplY3Qgd2l0aCBkZXNpcmVkIHVuaXRzIGFuZCBhbW91bnQsIGFsbCBvcHRpb25hbCxcclxuICAgIC8vIGFueSBjb21iaW5hdGlvbiB3aXRoIGFsbW9zdCBvbmUgc3BlY2lmaWVkLCBzYW1wbGU6XHJcbiAgICAvLyB7IHllYXJzOiAwLCBtb250aHM6IDAsIHdlZWtzOiAwLCBcclxuICAgIC8vICAgZGF5czogMCwgaG91cnM6IDAsIG1pbnV0ZXM6IDAsIHNlY29uZHM6IDAsIG1pbGxpc2Vjb25kczogMCB9XHJcbiAgICB0aGlzLnR0bCA9IG1vbWVudC5kdXJhdGlvbihvcHRpb25zLnR0bCkuYXNNaWxsaXNlY29uZHMoKTtcclxuICAgIHRoaXMubGF0ZXN0ID0gb3B0aW9ucy5sYXRlc3QgfHwgbnVsbDtcclxuXHJcbiAgICB0aGlzLm11c3RSZXZhbGlkYXRlID0gZnVuY3Rpb24gbXVzdFJldmFsaWRhdGUoKSB7XHJcbiAgICAgICAgdmFyIHRkaWZmID0gdGhpcy5sYXRlc3QgJiYgbmV3IERhdGUoKSAtIHRoaXMubGF0ZXN0IHx8IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcclxuICAgICAgICByZXR1cm4gdGRpZmYgPiB0aGlzLnR0bDtcclxuICAgIH07XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ2FjaGVDb250cm9sO1xyXG4iLCIvKipcclxuICAgIE5ldyBGdW5jdGlvbiBtZXRob2Q6ICdfZGVsYXllZCcuXHJcbiAgICBJdCByZXR1cm5zIGEgbmV3IGZ1bmN0aW9uLCB3cmFwcGluZyB0aGUgb3JpZ2luYWwgb25lLFxyXG4gICAgdGhhdCBvbmNlIGl0cyBjYWxsIHdpbGwgZGVsYXkgdGhlIGV4ZWN1dGlvbiB0aGUgZ2l2ZW4gbWlsbGlzZWNvbmRzLFxyXG4gICAgdXNpbmcgYSBzZXRUaW1lb3V0LlxyXG4gICAgVGhlIG5ldyBmdW5jdGlvbiByZXR1cm5zICd1bmRlZmluZWQnIHNpbmNlIGl0IGhhcyBub3QgdGhlIHJlc3VsdCxcclxuICAgIGJlY2F1c2Ugb2YgdGhhdCBpcyBvbmx5IHN1aXRhYmxlIHdpdGggcmV0dXJuLWZyZWUgZnVuY3Rpb25zIFxyXG4gICAgbGlrZSBldmVudCBoYW5kbGVycy5cclxuICAgIFxyXG4gICAgV2h5OiBzb21ldGltZXMsIHRoZSBoYW5kbGVyIGZvciBhbiBldmVudCBuZWVkcyB0byBiZSBleGVjdXRlZFxyXG4gICAgYWZ0ZXIgYSBkZWxheSBpbnN0ZWFkIG9mIGluc3RhbnRseS5cclxuKiovXHJcbkZ1bmN0aW9uLnByb3RvdHlwZS5fZGVsYXllZCA9IGZ1bmN0aW9uIGRlbGF5ZWQobWlsbGlzZWNvbmRzKSB7XHJcbiAgICB2YXIgZm4gPSB0aGlzO1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBjb250ZXh0ID0gdGhpcyxcclxuICAgICAgICAgICAgYXJncyA9IGFyZ3VtZW50cztcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZm4uYXBwbHkoY29udGV4dCwgYXJncyk7XHJcbiAgICAgICAgfSwgbWlsbGlzZWNvbmRzKTtcclxuICAgIH07XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgRXh0ZW5kaW5nIHRoZSBGdW5jdGlvbiBjbGFzcyB3aXRoIGFuIGluaGVyaXRzIG1ldGhvZC5cclxuICAgIFxyXG4gICAgVGhlIGluaXRpYWwgbG93IGRhc2ggaXMgdG8gbWFyayBpdCBhcyBuby1zdGFuZGFyZC5cclxuKiovXHJcbkZ1bmN0aW9uLnByb3RvdHlwZS5faW5oZXJpdHMgPSBmdW5jdGlvbiBfaW5oZXJpdHMoc3VwZXJDdG9yKSB7XHJcbiAgICB0aGlzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yOiB7XHJcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLFxyXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXHJcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKipcclxuICAgIFV0aWxpdHkgdGhhdCBhbGxvd3MgdG8ga2VlcCBhbiBvcmlnaW5hbCBtb2RlbCB1bnRvdWNoZWRcclxuICAgIHdoaWxlIGVkaXRpbmcgYSB2ZXJzaW9uLCBoZWxwaW5nIHN5bmNocm9uaXplIGJvdGhcclxuICAgIHdoZW4gZGVzaXJlZCBieSBwdXNoL3B1bGwvc3luYy1pbmcuXHJcbiAgICBcclxuICAgIEl0cyB0aGUgdXN1YWwgd2F5IHRvIHdvcmsgb24gZm9ybXMsIHdoZXJlIGFuIGluIG1lbW9yeVxyXG4gICAgbW9kZWwgY2FuIGJlIHVzZWQgYnV0IGluIGEgY29weSBzbyBjaGFuZ2VzIGRvZXNuJ3QgYWZmZWN0c1xyXG4gICAgb3RoZXIgdXNlcyBvZiB0aGUgaW4tbWVtb3J5IG1vZGVsIChhbmQgYXZvaWRzIHJlbW90ZSBzeW5jaW5nKVxyXG4gICAgdW50aWwgdGhlIGNvcHkgd2FudCB0byBiZSBwZXJzaXN0ZWQgYnkgcHVzaGluZyBpdCwgb3IgYmVpbmdcclxuICAgIGRpc2NhcmRlZCBvciByZWZyZXNoZWQgd2l0aCBhIHJlbW90ZWx5IHVwZGF0ZWQgb3JpZ2luYWwgbW9kZWwuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xyXG5cclxuZnVuY3Rpb24gTW9kZWxWZXJzaW9uKG9yaWdpbmFsKSB7XHJcbiAgICBcclxuICAgIEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm9yaWdpbmFsID0gb3JpZ2luYWw7XHJcbiAgICBcclxuICAgIC8vIENyZWF0ZSB2ZXJzaW9uXHJcbiAgICAvLyAodXBkYXRlV2l0aCB0YWtlcyBjYXJlIHRvIHNldCB0aGUgc2FtZSBkYXRhVGltZXN0YW1wKVxyXG4gICAgdGhpcy52ZXJzaW9uID0gb3JpZ2luYWwubW9kZWwuY2xvbmUoKTtcclxuICAgIFxyXG4gICAgLy8gQ29tcHV0ZWQgdGhhdCB0ZXN0IGVxdWFsaXR5LCBhbGxvd2luZyBiZWluZyBub3RpZmllZCBvZiBjaGFuZ2VzXHJcbiAgICAvLyBBIHJhdGVMaW1pdCBpcyB1c2VkIG9uIGVhY2ggdG8gYXZvaWQgc2V2ZXJhbCBzeW5jcmhvbm91cyBub3RpZmljYXRpb25zLlxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBSZXR1cm5zIHRydWUgd2hlbiBib3RoIHZlcnNpb25zIGhhcyB0aGUgc2FtZSB0aW1lc3RhbXBcclxuICAgICoqL1xyXG4gICAgdGhpcy5hcmVEaWZmZXJlbnQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24gYXJlRGlmZmVyZW50KCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMub3JpZ2luYWwubW9kZWwuZGF0YVRpbWVzdGFtcCgpICE9PSBcclxuICAgICAgICAgICAgdGhpcy52ZXJzaW9uLm1vZGVsLmRhdGFUaW1lc3RhbXAoKVxyXG4gICAgICAgICk7XHJcbiAgICB9LCB0aGlzKS5leHRlbmQoeyByYXRlTGltaXQ6IDAgfSk7XHJcbiAgICAvKipcclxuICAgICAgICBSZXR1cm5zIHRydWUgd2hlbiB0aGUgdmVyc2lvbiBoYXMgbmV3ZXIgY2hhbmdlcyB0aGFuXHJcbiAgICAgICAgdGhlIG9yaWdpbmFsXHJcbiAgICAqKi9cclxuICAgIHRoaXMuaXNOZXdlciA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbiBpc05ld2VyKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMub3JpZ2luYWwubW9kZWwuZGF0YVRpbWVzdGFtcCgpIDwgXHJcbiAgICAgICAgICAgIHRoaXMudmVyc2lvbi5tb2RlbC5kYXRhVGltZXN0YW1wKClcclxuICAgICAgICApO1xyXG4gICAgfSwgdGhpcykuZXh0ZW5kKHsgcmF0ZUxpbWl0OiAwIH0pO1xyXG4gICAgLyoqXHJcbiAgICAgICAgUmV0dXJucyB0cnVlIHdoZW4gdGhlIHZlcnNpb24gaGFzIG9sZGVyIGNoYW5nZXMgdGhhblxyXG4gICAgICAgIHRoZSBvcmlnaW5hbFxyXG4gICAgKiovXHJcbiAgICB0aGlzLmlzT2Jzb2xldGUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24gaXNDb21wdXRlZCgpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLm9yaWdpbmFsLm1vZGVsLmRhdGFUaW1lc3RhbXAoKSA+IFxyXG4gICAgICAgICAgICB0aGlzLnZlcnNpb24ubW9kZWwuZGF0YVRpbWVzdGFtcCgpXHJcbiAgICAgICAgKTtcclxuICAgIH0sIHRoaXMpLmV4dGVuZCh7IHJhdGVMaW1pdDogMCB9KTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNb2RlbFZlcnNpb247XHJcblxyXG5Nb2RlbFZlcnNpb24uX2luaGVyaXRzKEV2ZW50RW1pdHRlcik7XHJcblxyXG4vKipcclxuICAgIFNlbmRzIHRoZSB2ZXJzaW9uIGNoYW5nZXMgdG8gdGhlIG9yaWdpbmFsXHJcbiAgICBcclxuICAgIG9wdGlvbnM6IHtcclxuICAgICAgICBldmVuSWZOZXdlcjogZmFsc2VcclxuICAgIH1cclxuKiovXHJcbk1vZGVsVmVyc2lvbi5wcm90b3R5cGUucHVsbCA9IGZ1bmN0aW9uIHB1bGwob3B0aW9ucykge1xyXG5cclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgXHJcbiAgICAvLyBCeSBkZWZhdWx0LCBub3RoaW5nIHRvIGRvLCBvciBhdm9pZCBvdmVyd3JpdGUgY2hhbmdlcy5cclxuICAgIHZhciByZXN1bHQgPSBmYWxzZSxcclxuICAgICAgICByb2xsYmFjayA9IG51bGw7XHJcbiAgICBcclxuICAgIGlmIChvcHRpb25zLmV2ZW5JZk5ld2VyIHx8ICF0aGlzLmlzTmV3ZXIoKSkge1xyXG4gICAgICAgIC8vIFVwZGF0ZSB2ZXJzaW9uIHdpdGggdGhlIG9yaWdpbmFsIGRhdGEsXHJcbiAgICAgICAgLy8gY3JlYXRpbmcgZmlyc3QgYSByb2xsYmFjayBmdW5jdGlvbi5cclxuICAgICAgICByb2xsYmFjayA9IGNyZWF0ZVJvbGxiYWNrRnVuY3Rpb24odGhpcy52ZXJzaW9uKTtcclxuICAgICAgICAvLyBFdmVyIGRlZXBDb3B5LCBzaW5jZSBvbmx5IHByb3BlcnRpZXMgYW5kIGZpZWxkcyBmcm9tIG1vZGVsc1xyXG4gICAgICAgIC8vIGFyZSBjb3BpZWQgYW5kIHRoYXQgbXVzdCBhdm9pZCBjaXJjdWxhciByZWZlcmVuY2VzXHJcbiAgICAgICAgLy8gVGhlIG1ldGhvZCB1cGRhdGVXaXRoIHRha2VzIGNhcmUgdG8gc2V0IHRoZSBzYW1lIGRhdGFUaW1lc3RhbXA6ICAgICAgICBcclxuICAgICAgICB0aGlzLnZlcnNpb24ubW9kZWwudXBkYXRlV2l0aCh0aGlzLm9yaWdpbmFsLCB0cnVlKTtcclxuICAgICAgICAvLyBEb25lXHJcbiAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmVtaXQoJ3B1bGwnLCByZXN1bHQsIHJvbGxiYWNrKTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG4vKipcclxuICAgIERpc2NhcmQgdGhlIHZlcnNpb24gY2hhbmdlcyBnZXR0aW5nIHRoZSBvcmlnaW5hbFxyXG4gICAgZGF0YS5cclxuICAgIFxyXG4gICAgb3B0aW9uczoge1xyXG4gICAgICAgIGV2ZW5JZk9ic29sZXRlOiBmYWxzZVxyXG4gICAgfVxyXG4qKi9cclxuTW9kZWxWZXJzaW9uLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gcHVzaChvcHRpb25zKSB7XHJcbiAgICBcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgXHJcbiAgICAvLyBCeSBkZWZhdWx0LCBub3RoaW5nIHRvIGRvLCBvciBhdm9pZCBvdmVyd3JpdGUgY2hhbmdlcy5cclxuICAgIHZhciByZXN1bHQgPSBmYWxzZSxcclxuICAgICAgICByb2xsYmFjayA9IG51bGw7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuZXZlbklmT2Jzb2xldGUgfHwgIXRoaXMuaXNPYnNvbGV0ZSgpKSB7XHJcbiAgICAgICAgLy8gVXBkYXRlIG9yaWdpbmFsLCBjcmVhdGluZyBmaXJzdCBhIHJvbGxiYWNrIGZ1bmN0aW9uLlxyXG4gICAgICAgIHJvbGxiYWNrID0gY3JlYXRlUm9sbGJhY2tGdW5jdGlvbih0aGlzLm9yaWdpbmFsKTtcclxuICAgICAgICAvLyBFdmVyIGRlZXBDb3B5LCBzaW5jZSBvbmx5IHByb3BlcnRpZXMgYW5kIGZpZWxkcyBmcm9tIG1vZGVsc1xyXG4gICAgICAgIC8vIGFyZSBjb3BpZWQgYW5kIHRoYXQgbXVzdCBhdm9pZCBjaXJjdWxhciByZWZlcmVuY2VzXHJcbiAgICAgICAgLy8gVGhlIG1ldGhvZCB1cGRhdGVXaXRoIHRha2VzIGNhcmUgdG8gc2V0IHRoZSBzYW1lIGRhdGFUaW1lc3RhbXAuXHJcbiAgICAgICAgdGhpcy5vcmlnaW5hbC5tb2RlbC51cGRhdGVXaXRoKHRoaXMudmVyc2lvbiwgdHJ1ZSk7XHJcbiAgICAgICAgLy8gRG9uZVxyXG4gICAgICAgIHJlc3VsdCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5lbWl0KCdwdXNoJywgcmVzdWx0LCByb2xsYmFjayk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBTZXRzIG9yaWdpbmFsIGFuZCB2ZXJzaW9uIG9uIHRoZSBzYW1lIHZlcnNpb25cclxuICAgIGJ5IGdldHRpbmcgdGhlIG5ld2VzdCBvbmUuXHJcbioqL1xyXG5Nb2RlbFZlcnNpb24ucHJvdG90eXBlLnN5bmMgPSBmdW5jdGlvbiBzeW5jKCkge1xyXG4gICAgXHJcbiAgICBpZiAodGhpcy5pc05ld2VyKCkpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucHVzaCgpO1xyXG4gICAgZWxzZSBpZiAodGhpcy5pc09ic29sZXRlKCkpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucHVsbCgpO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgVXRpbGl0eSB0aGF0IGNyZWF0ZSBhIGZ1bmN0aW9uIGFibGUgdG8gXHJcbiAgICBwZXJmb3JtIGEgZGF0YSByb2xsYmFjayBvbiBleGVjdXRpb24sIHVzZWZ1bFxyXG4gICAgdG8gcGFzcyBvbiB0aGUgZXZlbnRzIHRvIGFsbG93IHJlYWN0IHVwb24gY2hhbmdlc1xyXG4gICAgb3IgZXh0ZXJuYWwgc3luY2hyb25pemF0aW9uIGZhaWx1cmVzLlxyXG4qKi9cclxuZnVuY3Rpb24gY3JlYXRlUm9sbGJhY2tGdW5jdGlvbihtb2RlbEluc3RhbmNlKSB7XHJcbiAgICAvLyBQcmV2aW91cyBmdW5jdGlvbiBjcmVhdGlvbiwgZ2V0IE5PVyB0aGUgaW5mb3JtYXRpb24gdG9cclxuICAgIC8vIGJlIGJhY2tlZCBmb3IgbGF0ZXIuXHJcbiAgICB2YXIgYmFja2VkRGF0YSA9IG1vZGVsSW5zdGFuY2UubW9kZWwudG9QbGFpbk9iamVjdCh0cnVlKSxcclxuICAgICAgICBiYWNrZWRUaW1lc3RhbXAgPSBtb2RlbEluc3RhbmNlLm1vZGVsLmRhdGFUaW1lc3RhbXAoKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgdGhlIGZ1bmN0aW9uIHRoYXQgKm1heSogZ2V0IGV4ZWN1dGVkIGxhdGVyLCBhZnRlclxyXG4gICAgLy8gY2hhbmdlcyB3ZXJlIGRvbmUgaW4gdGhlIG1vZGVsSW5zdGFuY2UuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gcm9sbGJhY2soKSB7XHJcbiAgICAgICAgLy8gU2V0IHRoZSBiYWNrZWQgZGF0YVxyXG4gICAgICAgIG1vZGVsSW5zdGFuY2UubW9kZWwudXBkYXRlV2l0aChiYWNrZWREYXRhKTtcclxuICAgICAgICAvLyBBbmQgdGhlIHRpbWVzdGFtcFxyXG4gICAgICAgIG1vZGVsSW5zdGFuY2UubW9kZWwuZGF0YVRpbWVzdGFtcChiYWNrZWRUaW1lc3RhbXApO1xyXG4gICAgfTtcclxufVxyXG4iLCIvKipcclxuICAgIFJlbW90ZU1vZGVsIGNsYXNzLlxyXG4gICAgXHJcbiAgICBJdCBoZWxwcyBtYW5hZ2luZyBhIG1vZGVsIGluc3RhbmNlLCBtb2RlbCB2ZXJzaW9uc1xyXG4gICAgZm9yIGluIG1lbW9yeSBtb2RpZmljYXRpb24sIGFuZCB0aGUgcHJvY2VzcyB0byBcclxuICAgIHJlY2VpdmUgb3Igc2VuZCB0aGUgbW9kZWwgZGF0YVxyXG4gICAgdG8gYSByZW1vdGUgc291cmNlcywgd2l0aCBnbHVlIGNvZGUgZm9yIHRoZSB0YXNrc1xyXG4gICAgYW5kIHN0YXRlIHByb3BlcnRpZXMuXHJcbiAgICBcclxuICAgIEV2ZXJ5IGluc3RhbmNlIG9yIHN1YmNsYXNzIG11c3QgaW1wbGVtZW50XHJcbiAgICB0aGUgZmV0Y2ggYW5kIHB1bGwgbWV0aG9kcyB0aGF0IGtub3dzIHRoZSBzcGVjaWZpY3NcclxuICAgIG9mIHRoZSByZW1vdGVzLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIE1vZGVsVmVyc2lvbiA9IHJlcXVpcmUoJy4uL3V0aWxzL01vZGVsVmVyc2lvbicpLFxyXG4gICAgQ2FjaGVDb250cm9sID0gcmVxdWlyZSgnLi4vdXRpbHMvQ2FjaGVDb250cm9sJyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBsb2NhbGZvcmFnZSA9IHJlcXVpcmUoJ2xvY2FsZm9yYWdlJyksXHJcbiAgICBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXI7XHJcblxyXG5mdW5jdGlvbiBSZW1vdGVNb2RlbChvcHRpb25zKSB7XHJcblxyXG4gICAgRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XHJcbiAgICBcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgXHJcbiAgICB2YXIgZmlyc3RUaW1lTG9hZCA9IHRydWU7XHJcbiAgICBcclxuICAgIC8vIE1hcmtzIGEgbG9jayBsb2FkaW5nIGlzIGhhcHBlbmluZywgYW55IHVzZXIgY29kZVxyXG4gICAgLy8gbXVzdCB3YWl0IGZvciBpdFxyXG4gICAgdGhpcy5pc0xvYWRpbmcgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuICAgIC8vIE1hcmtzIGEgbG9jayBzYXZpbmcgaXMgaGFwcGVuaW5nLCBhbnkgdXNlciBjb2RlXHJcbiAgICAvLyBtdXN0IHdhaXQgZm9yIGl0XHJcbiAgICB0aGlzLmlzU2F2aW5nID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcbiAgICAvLyBNYXJrcyBhIGJhY2tncm91bmQgc3luY2hyb25pemF0aW9uOiBsb2FkIG9yIHNhdmUsXHJcbiAgICAvLyB1c2VyIGNvZGUga25vd3MgaXMgaGFwcGVuaW5nIGJ1dCBjYW4gY29udGludWVcclxuICAgIC8vIHVzaW5nIGNhY2hlZCBkYXRhXHJcbiAgICB0aGlzLmlzU3luY2luZyA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgLy8gVXRpbGl0eSB0byBrbm93IHdoZXRoZXIgYW55IGxvY2tpbmcgb3BlcmF0aW9uIGlzXHJcbiAgICAvLyBoYXBwZW5pbmcuXHJcbiAgICAvLyBKdXN0IGxvYWRpbmcgb3Igc2F2aW5nXHJcbiAgICB0aGlzLmlzTG9ja2VkID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNMb2FkaW5nKCkgfHwgdGhpcy5pc1NhdmluZygpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIGlmICghb3B0aW9ucy5kYXRhKVxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUmVtb3RlTW9kZWwgZGF0YSBtdXN0IGJlIHNldCBvbiBjb25zdHJ1Y3RvciBhbmQgbm8gY2hhbmdlZCBsYXRlcicpO1xyXG4gICAgdGhpcy5kYXRhID0gb3B0aW9ucy5kYXRhO1xyXG4gICAgXHJcbiAgICB0aGlzLmNhY2hlID0gbmV3IENhY2hlQ29udHJvbCh7XHJcbiAgICAgICAgdHRsOiBvcHRpb25zLnR0bFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIE9wdGlvbmFsIG5hbWUgdXNlZCB0byBwZXJzaXN0IGEgY29weSBvZiB0aGUgZGF0YSBhcyBwbGFpbiBvYmplY3RcclxuICAgIC8vIGluIHRoZSBsb2NhbCBzdG9yYWdlIG9uIGV2ZXJ5IHN1Y2Nlc3NmdWxseSBsb2FkL3NhdmUgb3BlcmF0aW9uLlxyXG4gICAgLy8gV2l0aCBubyBuYW1lLCBubyBzYXZlZCAoZGVmYXVsdCkuXHJcbiAgICAvLyBJdCB1c2VzICdsb2NhbGZvcmFnZScsIHNvIG1heSBiZSBub3Qgc2F2ZWQgdXNpbmcgbG9jYWxTdG9yYWdlIGFjdHVhbGx5LFxyXG4gICAgLy8gYnV0IGFueSBzdXBwb3J0ZWQgYW5kIGluaXRpYWxpemVkIHN0b3JhZ2Ugc3lzdGVtLCBsaWtlIFdlYlNRTCwgSW5kZXhlZERCIG9yIExvY2FsU3RvcmFnZS5cclxuICAgIC8vIGxvY2FsZm9yYWdlIG11c3QgaGF2ZSBhIHNldC11cCBwcmV2aW91cyB1c2Ugb2YgdGhpcyBvcHRpb24uXHJcbiAgICB0aGlzLmxvY2FsU3RvcmFnZU5hbWUgPSBvcHRpb25zLmxvY2FsU3RvcmFnZU5hbWUgfHwgbnVsbDtcclxuICAgIFxyXG4gICAgLy8gUmVjb21tZW5kZWQgd2F5IHRvIGdldCB0aGUgaW5zdGFuY2UgZGF0YVxyXG4gICAgLy8gc2luY2UgaXQgZW5zdXJlcyB0byBsYXVuY2ggYSBsb2FkIG9mIHRoZVxyXG4gICAgLy8gZGF0YSBlYWNoIHRpbWUgaXMgYWNjZXNzZWQgdGhpcyB3YXkuXHJcbiAgICB0aGlzLmdldERhdGEgPSBmdW5jdGlvbiBnZXREYXRhKCkge1xyXG4gICAgICAgIHRoaXMubG9hZCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGE7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMubmV3VmVyc2lvbiA9IGZ1bmN0aW9uIG5ld1ZlcnNpb24oKSB7XHJcbiAgICAgICAgdmFyIHYgPSBuZXcgTW9kZWxWZXJzaW9uKHRoaXMuZGF0YSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVXBkYXRlIHRoZSB2ZXJzaW9uIGRhdGEgd2l0aCB0aGUgb3JpZ2luYWxcclxuICAgICAgICAvLyBhZnRlciBhIGxvY2sgbG9hZCBmaW5pc2gsIGxpa2UgdGhlIGZpcnN0IHRpbWUsXHJcbiAgICAgICAgLy8gc2luY2UgdGhlIFVJIHRvIGVkaXQgdGhlIHZlcnNpb24gd2lsbCBiZSBsb2NrXHJcbiAgICAgICAgLy8gaW4gdGhlIG1pZGRsZS5cclxuICAgICAgICB0aGlzLmlzTG9hZGluZy5zdWJzY3JpYmUoZnVuY3Rpb24gKGlzSXQpIHtcclxuICAgICAgICAgICAgaWYgKCFpc0l0KSB7XHJcbiAgICAgICAgICAgICAgICB2LnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFNhdmUgdGhlIHJlbW90ZSB3aGVuIHN1Y2Nlc3NmdWxseSBwdXNoZWQgdGhlIG5ldyB2ZXJzaW9uXHJcbiAgICAgICAgdi5vbigncHVzaCcsIGZ1bmN0aW9uKHN1Y2Nlc3MsIHJvbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGlmIChzdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNhdmUoKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSB2ZXJzaW9uIGRhdGEgd2l0aCB0aGUgbmV3IG9uZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGZyb20gdGhlIHJlbW90ZSwgdGhhdCBtYXkgaW5jbHVkZSByZW1vdGUgY29tcHV0ZWRcclxuICAgICAgICAgICAgICAgICAgICAvLyB2YWx1ZXM6XHJcbiAgICAgICAgICAgICAgICAgICAgdi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRvIGNhdGNoIHRoZSBlcnJvciBpcyBpbXBvcnRhbnQgXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdG8gYXZvaWQgJ3Vua25vdyBlcnJvcidzIGZyb20gYmVpbmdcclxuICAgICAgICAgICAgICAgICAgICAvLyBsb2dnZWQgb24gdGhlIGNvbnNvbGUuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGVycm9yIGNhbiBiZSByZWFkIGJ5IGxpc3RlbmluZyB0aGUgJ2Vycm9yJyBldmVudC5cclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAvLyBQZXJmb3JtcyBhIHJvbGxiYWNrIG9mIHRoZSBvcmlnaW5hbCBtb2RlbFxyXG4gICAgICAgICAgICAgICAgICAgIHJvbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIHZlcnNpb24gZGF0YSBrZWVwcyB1bnRvdWNoZWQsIHVzZXIgbWF5IHdhbnQgdG8gcmV0cnlcclxuICAgICAgICAgICAgICAgICAgICAvLyBvciBtYWRlIGNoYW5nZXMgb24gaXRzIHVuLXNhdmVkIGRhdGEuXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIHJldHVybiB2O1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgdGhpcy5mZXRjaCA9IG9wdGlvbnMuZmV0Y2ggfHwgZnVuY3Rpb24gZmV0Y2goKSB7IHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkJyk7IH07XHJcbiAgICB0aGlzLnB1c2ggPSBvcHRpb25zLnB1c2ggfHwgZnVuY3Rpb24gcHVzaCgpIHsgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZCcpOyB9O1xyXG5cclxuICAgIHZhciBsb2FkRnJvbVJlbW90ZSA9IGZ1bmN0aW9uIGxvYWRGcm9tUmVtb3RlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmZldGNoKClcclxuICAgICAgICAudGhlbihmdW5jdGlvbiAoc2VydmVyRGF0YSkge1xyXG4gICAgICAgICAgICBpZiAoc2VydmVyRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgLy8gRXZlciBkZWVwQ29weSwgc2luY2UgcGxhaW4gZGF0YSBmcm9tIHRoZSBzZXJ2ZXIgKGFuZCBhbnlcclxuICAgICAgICAgICAgICAgIC8vIGluIGJldHdlZW4gY29udmVyc2lvbiBvbiAnZmVjdGgnKSBjYW5ub3QgaGF2ZSBjaXJjdWxhclxyXG4gICAgICAgICAgICAgICAgLy8gcmVmZXJlbmNlczpcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5tb2RlbC51cGRhdGVXaXRoKHNlcnZlckRhdGEsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIHBlcnNpc3RlbnQgbG9jYWwgY29weT9cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxvY2FsU3RvcmFnZU5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhbGZvcmFnZS5zZXRJdGVtKHRoaXMubG9jYWxTdG9yYWdlTmFtZSwgc2VydmVyRGF0YSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlbW90ZSBtb2RlbCBkaWQgbm90IHJldHVybmVkIGRhdGEsIHJlc3BvbnNlIG11c3QgYmUgYSBcIk5vdCBGb3VuZFwiJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEV2ZW50XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzTG9hZGluZygpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2xvYWQnLCBzZXJ2ZXJEYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnc3luY2VkJywgc2VydmVyRGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEZpbmFsbHk6IGNvbW1vbiB0YXNrcyBvbiBzdWNjZXNzIG9yIGVycm9yXHJcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKGZhbHNlKTtcclxuICAgICAgICAgICAgdGhpcy5pc1N5bmNpbmcoZmFsc2UpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jYWNoZS5sYXRlc3QgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kYXRhO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSlcclxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgd2FzTG9hZCA9IHRoaXMuaXNMb2FkaW5nKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBGaW5hbGx5OiBjb21tb24gdGFza3Mgb24gc3VjY2VzcyBvciBlcnJvclxyXG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZyhmYWxzZSk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNTeW5jaW5nKGZhbHNlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEV2ZW50XHJcbiAgICAgICAgICAgIHZhciBlcnJQa2cgPSB7XHJcbiAgICAgICAgICAgICAgICB0YXNrOiB3YXNMb2FkID8gJ2xvYWQnIDogJ3N5bmMnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVyclxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvLyBCZSBjYXJlZnVsIHdpdGggJ2Vycm9yJyBldmVudCwgaXMgc3BlY2lhbCBhbmQgc3RvcHMgZXhlY3V0aW9uIG9uIGVtaXRcclxuICAgICAgICAgICAgLy8gaWYgbm8gbGlzdGVuZXJzIGF0dGFjaGVkOiBvdmVyd3JpdHRpbmcgdGhhdCBiZWhhdmlvciBieSBqdXN0XHJcbiAgICAgICAgICAgIC8vIHByaW50IG9uIGNvbnNvbGUgd2hlbiBub3RoaW5nLCBvciBlbWl0IGlmIHNvbWUgbGlzdGVuZXI6XHJcbiAgICAgICAgICAgIGlmIChFdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCh0aGlzLCAnZXJyb3InKSA+IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnZXJyb3InLCBlcnJQa2cpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gTG9nIGl0IHdoZW4gbm90IGhhbmRsZWQgKGV2ZW4gaWYgdGhlIHByb21pc2UgZXJyb3IgaXMgaGFuZGxlZClcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1JlbW90ZU1vZGVsIEVycm9yJywgZXJyUGtnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmV0aHJvdyBlcnJvclxyXG4gICAgICAgICAgICByZXR1cm4gZXJyO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubG9hZCA9IGZ1bmN0aW9uIGxvYWQoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuY2FjaGUubXVzdFJldmFsaWRhdGUoKSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGZpcnN0VGltZUxvYWQpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzTG9hZGluZyh0cnVlKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc1N5bmNpbmcodHJ1ZSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgcHJvbWlzZSA9IG51bGw7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBJZiBsb2NhbCBzdG9yYWdlIGlzIHNldCBmb3IgdGhpcywgbG9hZCBmaXJzdFxyXG4gICAgICAgICAgICAvLyBmcm9tIGxvY2FsLCB0aGVuIGZvbGxvdyB3aXRoIHN5bmNpbmcgZnJvbSByZW1vdGVcclxuICAgICAgICAgICAgaWYgKGZpcnN0VGltZUxvYWQgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMubG9jYWxTdG9yYWdlTmFtZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIHByb21pc2UgPSBsb2NhbGZvcmFnZS5nZXRJdGVtKHRoaXMubG9jYWxTdG9yYWdlTmFtZSlcclxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGxvY2FsRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2NhbERhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhLm1vZGVsLnVwZGF0ZVdpdGgobG9jYWxEYXRhLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIExvYWQgZG9uZTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlzU3luY2luZyhmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBMb2NhbCBsb2FkIGRvbmUsIGRvIGEgYmFja2dyb3VuZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyByZW1vdGUgbG9hZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkRnJvbVJlbW90ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBqdXN0IGRvbid0IHdhaXQsIHJldHVybiBjdXJyZW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRhdGFcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdoZW4gbm8gZGF0YSwgcGVyZm9ybSBhIHJlbW90ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBsb2FkIGFuZCB3YWl0IGZvciBpdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxvYWRGcm9tUmVtb3RlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIFBlcmZvcm0gdGhlIHJlbW90ZSBsb2FkOlxyXG4gICAgICAgICAgICAgICAgcHJvbWlzZSA9IGxvYWRGcm9tUmVtb3RlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIEZpcnN0IHRpbWUsIGJsb2NraW5nIGxvYWQ6XHJcbiAgICAgICAgICAgIC8vIGl0IHJldHVybnMgd2hlbiB0aGUgbG9hZCByZXR1cm5zXHJcbiAgICAgICAgICAgIGlmIChmaXJzdFRpbWVMb2FkKSB7XHJcbiAgICAgICAgICAgICAgICBmaXJzdFRpbWVMb2FkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAvLyBSZXR1cm5zIHRoZSBwcm9taXNlIGFuZCB3aWxsIHdhaXQgZm9yIHRoZSBmaXJzdCBsb2FkOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBCYWNrZ3JvdW5kIGxvYWQ6IGlzIGxvYWRpbmcgc3RpbGxcclxuICAgICAgICAgICAgICAgIC8vIGJ1dCB3ZSBoYXZlIGNhY2hlZCBkYXRhIHNvIHdlIHVzZVxyXG4gICAgICAgICAgICAgICAgLy8gdGhhdCBmb3Igbm93LiBJZiBhbnl0aGluZyBuZXcgZnJvbSBvdXRzaWRlXHJcbiAgICAgICAgICAgICAgICAvLyB2ZXJzaW9ucyB3aWxsIGdldCBub3RpZmllZCB3aXRoIGlzT2Jzb2xldGUoKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLmRhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBSZXR1cm4gY2FjaGVkIGRhdGEsIG5vIG5lZWQgdG8gbG9hZCBhZ2FpbiBmb3Igbm93LlxyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuZGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgICAgIHRoaXMuaXNTYXZpbmcodHJ1ZSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gUHJlc2VydmUgdGhlIHRpbWVzdGFtcCBhZnRlciBiZWluZyBzYXZlZFxyXG4gICAgICAgIC8vIHRvIGF2b2lkIGZhbHNlICdvYnNvbGV0ZScgd2FybmluZ3Mgd2l0aFxyXG4gICAgICAgIC8vIHRoZSB2ZXJzaW9uIHRoYXQgY3JlYXRlZCB0aGUgbmV3IG9yaWdpbmFsXHJcbiAgICAgICAgdmFyIHRzID0gdGhpcy5kYXRhLm1vZGVsLmRhdGFUaW1lc3RhbXAoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucHVzaCgpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHNlcnZlckRhdGEpIHtcclxuICAgICAgICAgICAgLy8gRXZlciBkZWVwQ29weSwgc2luY2UgcGxhaW4gZGF0YSBmcm9tIHRoZSBzZXJ2ZXJcclxuICAgICAgICAgICAgLy8gY2Fubm90IGhhdmUgY2lyY3VsYXIgcmVmZXJlbmNlczpcclxuICAgICAgICAgICAgdGhpcy5kYXRhLm1vZGVsLnVwZGF0ZVdpdGgoc2VydmVyRGF0YSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5tb2RlbC5kYXRhVGltZXN0YW1wKHRzKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIHBlcnNpc3RlbnQgbG9jYWwgY29weT9cclxuICAgICAgICAgICAgaWYgKHRoaXMubG9jYWxTdG9yYWdlTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgbG9jYWxmb3JhZ2Uuc2V0SXRlbSh0aGlzLmxvY2FsU3RvcmFnZU5hbWUsIHNlcnZlckRhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBFdmVudFxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3NhdmVkJywgc2VydmVyRGF0YSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBGaW5hbGx5OiBjb21tb24gdGFza3Mgb24gc3VjY2VzcyBvciBlcnJvclxyXG4gICAgICAgICAgICB0aGlzLmlzU2F2aW5nKGZhbHNlKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuY2FjaGUubGF0ZXN0ID0gbmV3IERhdGUoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF0YTtcclxuICAgICAgICB9LmJpbmQodGhpcykpXHJcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICAvLyBGaW5hbGx5OiBjb21tb24gdGFza3Mgb24gc3VjY2VzcyBvciBlcnJvclxyXG4gICAgICAgICAgICB0aGlzLmlzU2F2aW5nKGZhbHNlKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIEV2ZW50XHJcbiAgICAgICAgICAgIHZhciBlcnJQa2cgPSB7XHJcbiAgICAgICAgICAgICAgICB0YXNrOiAnc2F2ZScsXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8vIEJlIGNhcmVmdWwgd2l0aCAnZXJyb3InIGV2ZW50LCBpcyBzcGVjaWFsIGFuZCBzdG9wcyBleGVjdXRpb24gb24gZW1pdFxyXG4gICAgICAgICAgICAvLyBpZiBubyBsaXN0ZW5lcnMgYXR0YWNoZWQ6IG92ZXJ3cml0dGluZyB0aGF0IGJlaGF2aW9yIGJ5IGp1c3RcclxuICAgICAgICAgICAgLy8gcHJpbnQgb24gY29uc29sZSB3aGVuIG5vdGhpbmcsIG9yIGVtaXQgaWYgc29tZSBsaXN0ZW5lcjpcclxuICAgICAgICAgICAgaWYgKEV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50KHRoaXMsICdlcnJvcicpID4gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdlcnJvcicsIGVyclBrZyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBMb2cgaXQgd2hlbiBub3QgaGFuZGxlZCAoZXZlbiBpZiB0aGUgcHJvbWlzZSBlcnJvciBpcyBoYW5kbGVkKVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignUmVtb3RlTW9kZWwgRXJyb3InLCBlcnJQa2cpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBSZXRocm93IGVycm9yXHJcbiAgICAgICAgICAgIHJldHVybiBlcnI7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIExhdW5jaCBhIHN5bmNpbmcgcmVxdWVzdC4gUmV0dXJucyBub3RoaW5nLCB0aGVcclxuICAgICAgICB3YXkgdG8gdHJhY2sgYW55IHJlc3VsdCBpcyB3aXRoIGV2ZW50cyBvciBcclxuICAgICAgICB0aGUgaW5zdGFuY2Ugb2JzZXJ2YWJsZXMuXHJcbiAgICAgICAgSU1QT1JUQU5UOiByaWdodCBub3cgaXMganVzdCBhIHJlcXVlc3QgZm9yICdsb2FkJ1xyXG4gICAgICAgIHRoYXQgYXZvaWRzIHByb21pc2UgZXJyb3JzIGZyb20gdGhyb3dpbmcuXHJcbiAgICAqKi9cclxuICAgIHRoaXMuc3luYyA9IGZ1bmN0aW9uIHN5bmMoKSB7XHJcbiAgICAgICAgLy8gQ2FsbCBmb3IgYSBsb2FkLCB0aGF0IHdpbGwgYmUgdHJlYXRlZCBhcyAnc3luY2luZycgYWZ0ZXIgdGhlXHJcbiAgICAgICAgLy8gZmlyc3QgbG9hZFxyXG4gICAgICAgIHRoaXMubG9hZCgpXHJcbiAgICAgICAgLy8gQXZvaWQgZXJyb3JzIGZyb20gdGhyb3dpbmcgaW4gdGhlIGNvbnNvbGUsXHJcbiAgICAgICAgLy8gdGhlICdlcnJvcicgZXZlbnQgaXMgdGhlcmUgdG8gdHJhY2sgYW55b25lLlxyXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbigpIHt9KTtcclxuICAgIH07XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVtb3RlTW9kZWw7XHJcblxyXG5SZW1vdGVNb2RlbC5faW5oZXJpdHMoRXZlbnRFbWl0dGVyKTtcclxuIiwiLyoqXHJcbiAgICBSRVNUIEFQSSBhY2Nlc3NcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmZ1bmN0aW9uIGxvd2VyRmlyc3RMZXR0ZXIobikge1xyXG4gICAgcmV0dXJuIG4gJiYgblswXSAmJiBuWzBdLnRvTG93ZXJDYXNlICYmIChuWzBdLnRvTG93ZXJDYXNlKCkgKyBuLnNsaWNlKDEpKSB8fCBuO1xyXG59XHJcblxyXG5mdW5jdGlvbiBsb3dlckNhbWVsaXplT2JqZWN0KG9iaikge1xyXG4gICAgLy9qc2hpbnQgbWF4Y29tcGxleGl0eTo4XHJcbiAgICBcclxuICAgIGlmICghb2JqIHx8IHR5cGVvZihvYmopICE9PSAnb2JqZWN0JykgcmV0dXJuIG9iajtcclxuXHJcbiAgICB2YXIgcmV0ID0gQXJyYXkuaXNBcnJheShvYmopID8gW10gOiB7fTtcclxuICAgIGZvcih2YXIgayBpbiBvYmopIHtcclxuICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGspKSB7XHJcbiAgICAgICAgICAgIHZhciBuZXdrID0gbG93ZXJGaXJzdExldHRlcihrKTtcclxuICAgICAgICAgICAgcmV0W25ld2tdID0gdHlwZW9mKG9ialtrXSkgPT09ICdvYmplY3QnID9cclxuICAgICAgICAgICAgICAgIGxvd2VyQ2FtZWxpemVPYmplY3Qob2JqW2tdKSA6XHJcbiAgICAgICAgICAgICAgICBvYmpba11cclxuICAgICAgICAgICAgO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZXQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFJlc3Qob3B0aW9uc09yVXJsKSB7XHJcbiAgICBcclxuICAgIHZhciB1cmwgPSB0eXBlb2Yob3B0aW9uc09yVXJsKSA9PT0gJ3N0cmluZycgP1xyXG4gICAgICAgIG9wdGlvbnNPclVybCA6XHJcbiAgICAgICAgb3B0aW9uc09yVXJsICYmIG9wdGlvbnNPclVybC51cmw7XHJcblxyXG4gICAgdGhpcy5iYXNlVXJsID0gdXJsO1xyXG4gICAgLy8gT3B0aW9uYWwgZXh0cmFIZWFkZXJzIGZvciBhbGwgcmVxdWVzdHMsXHJcbiAgICAvLyB1c3VhbGx5IGZvciBhdXRoZW50aWNhdGlvbiB0b2tlbnNcclxuICAgIHRoaXMuZXh0cmFIZWFkZXJzID0gbnVsbDtcclxufVxyXG5cclxuUmVzdC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0KGFwaVVybCwgZGF0YSkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChhcGlVcmwsICdnZXQnLCBkYXRhKTtcclxufTtcclxuXHJcblJlc3QucHJvdG90eXBlLnB1dCA9IGZ1bmN0aW9uIGdldChhcGlVcmwsIGRhdGEpIHtcclxuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoYXBpVXJsLCAncHV0JywgZGF0YSk7XHJcbn07XHJcblxyXG5SZXN0LnByb3RvdHlwZS5wb3N0ID0gZnVuY3Rpb24gZ2V0KGFwaVVybCwgZGF0YSkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChhcGlVcmwsICdwb3N0JywgZGF0YSk7XHJcbn07XHJcblxyXG5SZXN0LnByb3RvdHlwZS5kZWxldGUgPSBmdW5jdGlvbiBnZXQoYXBpVXJsLCBkYXRhKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KGFwaVVybCwgJ2RlbGV0ZScsIGRhdGEpO1xyXG59O1xyXG5cclxuUmVzdC5wcm90b3R5cGUucHV0RmlsZSA9IGZ1bmN0aW9uIHB1dEZpbGUoYXBpVXJsLCBkYXRhKSB7XHJcbiAgICAvLyBOT1RFIGJhc2ljIHB1dEZpbGUgaW1wbGVtZW50YXRpb24sIG9uZSBmaWxlLCB1c2UgZmlsZVVwbG9hZD9cclxuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoYXBpVXJsLCAnZGVsZXRlJywgZGF0YSwgJ211bHRpcGFydC9mb3JtLWRhdGEnKTtcclxufTtcclxuXHJcblJlc3QucHJvdG90eXBlLnJlcXVlc3QgPSBmdW5jdGlvbiByZXF1ZXN0KGFwaVVybCwgaHR0cE1ldGhvZCwgZGF0YSwgY29udGVudFR5cGUpIHtcclxuICAgIFxyXG4gICAgdmFyIHRoaXNSZXN0ID0gdGhpcztcclxuICAgIHZhciB1cmwgPSB0aGlzLmJhc2VVcmwgKyBhcGlVcmw7XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgkLmFqYXgoe1xyXG4gICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgIC8vIEF2b2lkIGNhY2hlIGZvciBkYXRhLlxyXG4gICAgICAgIGNhY2hlOiBmYWxzZSxcclxuICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxyXG4gICAgICAgIG1ldGhvZDogaHR0cE1ldGhvZCxcclxuICAgICAgICBoZWFkZXJzOiB0aGlzLmV4dHJhSGVhZGVycyxcclxuICAgICAgICAvLyBVUkxFTkNPREVEIGlucHV0OlxyXG4gICAgICAgIC8vIENvbnZlcnQgdG8gSlNPTiBhbmQgYmFjayBqdXN0IHRvIGVuc3VyZSB0aGUgdmFsdWVzIGFyZSBjb252ZXJ0ZWQvZW5jb2RlZFxyXG4gICAgICAgIC8vIHByb3Blcmx5IHRvIGJlIHNlbnQsIGxpa2UgRGF0ZXMgYmVpbmcgY29udmVydGVkIHRvIElTTyBmb3JtYXQuXHJcbiAgICAgICAgZGF0YTogZGF0YSAmJiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGRhdGEpKSxcclxuICAgICAgICBjb250ZW50VHlwZTogY29udGVudFR5cGUgfHwgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCdcclxuICAgICAgICAvLyBBbHRlcm5hdGU6IEpTT04gYXMgaW5wdXRcclxuICAgICAgICAvL2RhdGE6IEpTT04uc3RyaW5naWZ5KGRhdGEpLFxyXG4gICAgICAgIC8vY29udGVudFR5cGU6IGNvbnRlbnRUeXBlIHx8ICdhcHBsaWNhdGlvbi9qc29uJ1xyXG4gICAgfSkpXHJcbiAgICAudGhlbihsb3dlckNhbWVsaXplT2JqZWN0KVxyXG4gICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgIC8vIE9uIGF1dGhvcml6YXRpb24gZXJyb3IsIGdpdmUgb3BvcnR1bml0eSB0byByZXRyeSB0aGUgb3BlcmF0aW9uXHJcbiAgICAgICAgaWYgKGVyci5zdGF0dXMgPT09IDQwMSkge1xyXG4gICAgICAgICAgICB2YXIgcmV0cnkgPSByZXF1ZXN0LmJpbmQodGhpcywgYXBpVXJsLCBodHRwTWV0aG9kLCBkYXRhLCBjb250ZW50VHlwZSk7XHJcbiAgICAgICAgICAgIHZhciByZXRyeVByb21pc2UgPSB0aGlzUmVzdC5vbkF1dGhvcml6YXRpb25SZXF1aXJlZChyZXRyeSk7XHJcbiAgICAgICAgICAgIGlmIChyZXRyeVByb21pc2UpIHtcclxuICAgICAgICAgICAgICAgIC8vIEl0IHJldHVybmVkIHNvbWV0aGluZywgZXhwZWN0aW5nIGlzIGEgcHJvbWlzZTpcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmV0cnlQcm9taXNlKVxyXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlcmUgaXMgZXJyb3Igb24gcmV0cnksIGp1c3QgcmV0dXJuIHRoZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIG9yaWdpbmFsIGNhbGwgZXJyb3JcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gYnkgZGVmYXVsdCwgY29udGludWUgcHJvcGFnYXRpbmcgdGhlIGVycm9yXHJcbiAgICAgICAgcmV0dXJuIGVycjtcclxuICAgIH0pO1xyXG59O1xyXG5cclxuUmVzdC5wcm90b3R5cGUub25BdXRob3JpemF0aW9uUmVxdWlyZWQgPSBmdW5jdGlvbiBvbkF1dGhvcml6YXRpb25SZXF1aXJlZCgvKnJldHJ5Ki8pIHtcclxuICAgIC8vIFRvIGJlIGltcGxlbWVudGVkIG91dHNpZGUsIGlmIGNvbnZlbmllbnQgZXhlY3V0aW5nOlxyXG4gICAgLy9yZXRyeSgpO1xyXG4gICAgLy8gYnkgZGVmYXVsdCBkb24ndCB3YWl0IGZvciByZXRyeSwganVzdCByZXR1cm4gbm90aGluZzpcclxuICAgIHJldHVybjtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVzdDtcclxuIiwiLyoqXHJcbiAgICBUaW1lIGNsYXNzIHV0aWxpdHkuXHJcbiAgICBTaG9ydGVyIHdheSB0byBjcmVhdGUgYSBEYXRlIGluc3RhbmNlXHJcbiAgICBzcGVjaWZ5aW5nIG9ubHkgdGhlIFRpbWUgcGFydCxcclxuICAgIGRlZmF1bHRpbmcgdG8gY3VycmVudCBkYXRlIG9yIFxyXG4gICAgYW5vdGhlciByZWFkeSBkYXRlIGluc3RhbmNlLlxyXG4qKi9cclxuZnVuY3Rpb24gVGltZShkYXRlLCBob3VyLCBtaW51dGUsIHNlY29uZCkge1xyXG4gICAgaWYgKCEoZGF0ZSBpbnN0YW5jZW9mIERhdGUpKSB7XHJcbiBcclxuICAgICAgICBzZWNvbmQgPSBtaW51dGU7XHJcbiAgICAgICAgbWludXRlID0gaG91cjtcclxuICAgICAgICBob3VyID0gZGF0ZTtcclxuICAgICAgICBcclxuICAgICAgICBkYXRlID0gbmV3IERhdGUoKTsgICBcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IERhdGUoZGF0ZS5nZXRGdWxsWWVhcigpLCBkYXRlLmdldE1vbnRoKCksIGRhdGUuZ2V0RGF0ZSgpLCBob3VyIHx8IDAsIG1pbnV0ZSB8fCAwLCBzZWNvbmQgfHwgMCk7XHJcbn1cclxubW9kdWxlLmV4cG9ydHMgPSBUaW1lO1xyXG4iLCIvKipcclxuICAgIENyZWF0ZSBhbiBBY2Nlc3MgQ29udHJvbCBmb3IgYW4gYXBwIHRoYXQganVzdCBjaGVja3NcclxuICAgIHRoZSBhY3Rpdml0eSBwcm9wZXJ0eSBmb3IgYWxsb3dlZCB1c2VyIGxldmVsLlxyXG4gICAgVG8gYmUgcHJvdmlkZWQgdG8gU2hlbGwuanMgYW5kIHVzZWQgYnkgdGhlIGFwcC5qcyxcclxuICAgIHZlcnkgdGllZCB0byB0aGF0IGJvdGggY2xhc3Nlcy5cclxuICAgIFxyXG4gICAgQWN0aXZpdGllcyBjYW4gZGVmaW5lIG9uIGl0cyBvYmplY3QgYW4gYWNjZXNzTGV2ZWxcclxuICAgIHByb3BlcnR5IGxpa2UgbmV4dCBleGFtcGxlc1xyXG4gICAgXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJ0eXBlLlVzZXI7IC8vIGFueW9uZVxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Bbm9ueW1vdXM7IC8vIGFub255bW91cyB1c2VycyBvbmx5XHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7IC8vIGF1dGhlbnRpY2F0ZWQgdXNlcnMgb25seVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy8gVXNlclR5cGUgZW51bWVyYXRpb24gaXMgYml0IGJhc2VkLCBzbyBzZXZlcmFsXHJcbi8vIHVzZXJzIGNhbiBoYXMgYWNjZXNzIGluIGEgc2luZ2xlIHByb3BlcnR5XHJcbi8vdmFyIFVzZXJUeXBlID0gcmVxdWlyZSgnLi4vbW9kZWxzL1VzZXInKS5Vc2VyVHlwZTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlQWNjZXNzQ29udHJvbChhcHApIHtcclxuICAgIFxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGFjY2Vzc0NvbnRyb2wocm91dGUpIHtcclxuXHJcbiAgICAgICAgdmFyIGFjdGl2aXR5ID0gYXBwLmdldEFjdGl2aXR5Q29udHJvbGxlckJ5Um91dGUocm91dGUpO1xyXG5cclxuICAgICAgICB2YXIgdXNlciA9IGFwcC5tb2RlbC51c2VyKCk7XHJcbiAgICAgICAgdmFyIGN1cnJlbnRUeXBlID0gdXNlciAmJiB1c2VyLnVzZXJUeXBlKCk7XHJcblxyXG4gICAgICAgIGlmIChhY3Rpdml0eSAmJiBhY3Rpdml0eS5hY2Nlc3NMZXZlbCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGNhbiA9IGFjdGl2aXR5LmFjY2Vzc0xldmVsICYgY3VycmVudFR5cGU7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoIWNhbikge1xyXG4gICAgICAgICAgICAgICAgLy8gTm90aWZ5IGVycm9yLCB3aHkgY2Fubm90IGFjY2Vzc1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZExldmVsOiBhY3Rpdml0eS5hY2Nlc3NMZXZlbCxcclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50VHlwZTogY3VycmVudFR5cGVcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEFsbG93XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9O1xyXG59O1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgdW53cmFwID0gZnVuY3Rpb24gdW53cmFwKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gKHR5cGVvZih2YWx1ZSkgPT09ICdmdW5jdGlvbicgPyB2YWx1ZSgpIDogdmFsdWUpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5kZWZpbmVDcnVkQXBpRm9yUmVzdCA9IGZ1bmN0aW9uIGRlZmluZUNydWRBcGlGb3JSZXN0KHNldHRpbmdzKSB7XHJcbiAgICBcclxuICAgIHZhciBleHRlbmRlZE9iamVjdCA9IHNldHRpbmdzLmV4dGVuZGVkT2JqZWN0LFxyXG4gICAgICAgIE1vZGVsID0gc2V0dGluZ3MuTW9kZWwsXHJcbiAgICAgICAgbW9kZWxOYW1lID0gc2V0dGluZ3MubW9kZWxOYW1lLFxyXG4gICAgICAgIG1vZGVsTGlzdE5hbWUgPSBzZXR0aW5ncy5tb2RlbExpc3ROYW1lLFxyXG4gICAgICAgIG1vZGVsVXJsID0gc2V0dGluZ3MubW9kZWxVcmwsXHJcbiAgICAgICAgaWRQcm9wZXJ0eU5hbWUgPSBzZXR0aW5ncy5pZFByb3BlcnR5TmFtZTtcclxuXHJcbiAgICBleHRlbmRlZE9iamVjdFsnZ2V0JyArIG1vZGVsTGlzdE5hbWVdID0gZnVuY3Rpb24gZ2V0TGlzdChmaWx0ZXJzKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5nZXQobW9kZWxVcmwsIGZpbHRlcnMpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmF3SXRlbXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJhd0l0ZW1zICYmIHJhd0l0ZW1zLm1hcChmdW5jdGlvbihyYXdJdGVtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE1vZGVsKHJhd0l0ZW0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIGV4dGVuZGVkT2JqZWN0WydnZXQnICsgbW9kZWxOYW1lXSA9IGZ1bmN0aW9uIGdldEl0ZW0oaXRlbUlEKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5nZXQobW9kZWxVcmwgKyAnLycgKyBpdGVtSUQpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmF3SXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmF3SXRlbSAmJiBuZXcgTW9kZWwocmF3SXRlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGV4dGVuZGVkT2JqZWN0Wydwb3N0JyArIG1vZGVsTmFtZV0gPSBmdW5jdGlvbiBwb3N0SXRlbShhbkl0ZW0pIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpcy5yZXN0LnBvc3QobW9kZWxVcmwsIGFuSXRlbSlcclxuICAgICAgICAudGhlbihmdW5jdGlvbihzZXJ2ZXJJdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgTW9kZWwoc2VydmVySXRlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGV4dGVuZGVkT2JqZWN0WydwdXQnICsgbW9kZWxOYW1lXSA9IGZ1bmN0aW9uIHB1dEl0ZW0oYW5JdGVtKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5wdXQobW9kZWxVcmwgKyAnLycgKyB1bndyYXAoYW5JdGVtW2lkUHJvcGVydHlOYW1lXSksIGFuSXRlbSlcclxuICAgICAgICAudGhlbihmdW5jdGlvbihzZXJ2ZXJJdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgTW9kZWwoc2VydmVySXRlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBleHRlbmRlZE9iamVjdFsnc2V0JyArIG1vZGVsTmFtZV0gPSBmdW5jdGlvbiBzZXRJdGVtKGFuSXRlbSkge1xyXG4gICAgICAgIHZhciBpZCA9IHVud3JhcChhbkl0ZW1baWRQcm9wZXJ0eU5hbWVdKTtcclxuICAgICAgICBpZiAoaWQpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzWydwdXQnICsgbW9kZWxOYW1lXShhbkl0ZW0pO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbJ3Bvc3QnICsgbW9kZWxOYW1lXShhbkl0ZW0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBleHRlbmRlZE9iamVjdFsnZGVsJyArIG1vZGVsTmFtZV0gPSBmdW5jdGlvbiBkZWxJdGVtKGFuSXRlbSkge1xyXG4gICAgICAgIHZhciBpZCA9IGFuSXRlbSAmJiB1bndyYXAoYW5JdGVtW2lkUHJvcGVydHlOYW1lXSkgfHxcclxuICAgICAgICAgICAgICAgIGFuSXRlbTtcclxuICAgICAgICBpZiAoaWQpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc3QuZGVsZXRlKG1vZGVsVXJsICsgJy8nICsgaWQsIGFuSXRlbSlcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oZGVsZXRlZEl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkZWxldGVkSXRlbSAmJiBuZXcgTW9kZWwoZGVsZXRlZEl0ZW0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTmVlZCBhbiBJRCBvciBhbiBvYmplY3Qgd2l0aCB0aGUgSUQgcHJvcGVydHkgdG8gZGVsZXRlJyk7XHJcbiAgICB9O1xyXG59OyIsIi8qKlxyXG4gICAgQm9vdGtub2NrOiBTZXQgb2YgS25vY2tvdXQgQmluZGluZyBIZWxwZXJzIGZvciBCb290c3RyYXAganMgY29tcG9uZW50cyAoanF1ZXJ5IHBsdWdpbnMpXHJcbiAgICBcclxuICAgIERlcGVuZGVuY2llczoganF1ZXJ5XHJcbiAgICBJbmplY3RlZCBkZXBlbmRlbmNpZXM6IGtub2Nrb3V0XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vLyBEZXBlbmRlbmNpZXNcclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuLy8gREkgaTE4biBsaWJyYXJ5XHJcbmV4cG9ydHMuaTE4biA9IG51bGw7XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVIZWxwZXJzKGtvKSB7XHJcbiAgICB2YXIgaGVscGVycyA9IHt9O1xyXG5cclxuICAgIC8qKiBQb3BvdmVyIEJpbmRpbmcgKiovXHJcbiAgICBoZWxwZXJzLnBvcG92ZXIgPSB7XHJcbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZUFjY2Vzc29yKSB7XHJcbiAgICAgICAgICAgIHZhciBzcmNPcHRpb25zID0ga28udW53cmFwKHZhbHVlQWNjZXNzb3IoKSk7XHJcblxyXG4gICAgICAgICAgICAvLyBEdXBsaWNhdGluZyBvcHRpb25zIG9iamVjdCB0byBwYXNzIHRvIHBvcG92ZXIgd2l0aG91dFxyXG4gICAgICAgICAgICAvLyBvdmVyd3JpdHRuZyBzb3VyY2UgY29uZmlndXJhdGlvblxyXG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzcmNPcHRpb25zKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFVud3JhcHBpbmcgY29udGVudCB0ZXh0XHJcbiAgICAgICAgICAgIG9wdGlvbnMuY29udGVudCA9IGtvLnVud3JhcChzcmNPcHRpb25zLmNvbnRlbnQpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY29udGVudCkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIExvY2FsaXplOlxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5jb250ZW50ID0gXHJcbiAgICAgICAgICAgICAgICAgICAgZXhwb3J0cy5pMThuICYmIGV4cG9ydHMuaTE4bi50KG9wdGlvbnMuY29udGVudCkgfHxcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmNvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIFRvIGdldCB0aGUgbmV3IG9wdGlvbnMsIHdlIG5lZWQgZGVzdHJveSBpdCBmaXJzdDpcclxuICAgICAgICAgICAgICAgICQoZWxlbWVudCkucG9wb3ZlcignZGVzdHJveScpLnBvcG92ZXIob3B0aW9ucyk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU2UgbXVlc3RyYSBzaSBlbCBlbGVtZW50byB0aWVuZSBlbCBmb2NvXHJcbiAgICAgICAgICAgICAgICBpZiAoJChlbGVtZW50KS5pcygnOmZvY3VzJykpXHJcbiAgICAgICAgICAgICAgICAgICAgJChlbGVtZW50KS5wb3BvdmVyKCdzaG93Jyk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJChlbGVtZW50KS5wb3BvdmVyKCdkZXN0cm95Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICByZXR1cm4gaGVscGVycztcclxufVxyXG5cclxuLyoqXHJcbiAgICBQbHVnIGhlbHBlcnMgaW4gdGhlIHByb3ZpZGVkIEtub2Nrb3V0IGluc3RhbmNlXHJcbioqL1xyXG5mdW5jdGlvbiBwbHVnSW4oa28sIHByZWZpeCkge1xyXG4gICAgdmFyIG5hbWUsXHJcbiAgICAgICAgaGVscGVycyA9IGNyZWF0ZUhlbHBlcnMoa28pO1xyXG4gICAgXHJcbiAgICBmb3IodmFyIGggaW4gaGVscGVycykge1xyXG4gICAgICAgIGlmIChoZWxwZXJzLmhhc093blByb3BlcnR5ICYmICFoZWxwZXJzLmhhc093blByb3BlcnR5KGgpKVxyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuXHJcbiAgICAgICAgbmFtZSA9IHByZWZpeCA/IHByZWZpeCArIGhbMF0udG9VcHBlckNhc2UoKSArIGguc2xpY2UoMSkgOiBoO1xyXG4gICAgICAgIGtvLmJpbmRpbmdIYW5kbGVyc1tuYW1lXSA9IGhlbHBlcnNbaF07XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydHMucGx1Z0luID0gcGx1Z0luO1xyXG5leHBvcnRzLmNyZWF0ZUJpbmRpbmdIZWxwZXJzID0gY3JlYXRlSGVscGVycztcclxuIiwiLyoqXHJcbiAgICBLbm9ja291dCBCaW5kaW5nIEhlbHBlciBmb3IgdGhlIEJvb3RzdHJhcCBTd2l0Y2ggcGx1Z2luLlxyXG4gICAgXHJcbiAgICBEZXBlbmRlbmNpZXM6IGpxdWVyeSwgYm9vdHN0cmFwLCBib290c3RyYXAtc3dpdGNoXHJcbiAgICBJbmplY3RlZCBkZXBlbmRlbmNpZXM6IGtub2Nrb3V0XHJcbiAgICBcclxuICAgIElNUE9SVEFOVCBOT1RFUzpcclxuICAgIC0gQSBjb25zb2xlIGVycm9yIG9mIHR5cGUgXCJvYmplY3QgaGFzIG5vdCB0aGF0IHByb3BlcnR5XCIgd2lsbCBoYXBwZW4gaWYgc3BlY2lmaWVkXHJcbiAgICAgICAgYSBub24gZXhpc3RhbnQgb3B0aW9uIGluIHRoZSBiaW5kaW5nLiBUaGUgZXJyb3IgbG9va3Mgc3RyYW5nZSB3aGVuIHVzaW5nIHRoZSBtaW5pZmllZCBmaWxlLlxyXG4gICAgLSBUaGUgb3JkZXIgb2Ygb3B0aW9ucyBpbiB0aGUgYmluZGluZyBtYXR0ZXJzIHdoZW4gY29tYmluaW5nIHdpdGggZGlzYWJsZWQgYW5kIHJlYWRvbmx5XHJcbiAgICAgICAgb3B0aW9uczogaWYgdGhlIGVsZW1lbnQgaXMgZGlzYWJsZWQ6dHJ1ZSBvciByZWFkb25seTp0cnVlLCBhbnkgYXR0ZW1wdCB0byBjaGFuZ2UgdGhlXHJcbiAgICAgICAgdmFsdWUgd2lsbCBmYWlsIHNpbGVudGx5LCBzbyBpZiB0aGUgc2FtZSBiaW5kaW5nIHVwZGF0ZSBjaGFuZ2VzIGRpc2FibGVkIHRvIGZhbHNlXHJcbiAgICAgICAgYW5kIHRoZSBzdGF0ZSwgdGhlICdkaXNhYmxlZCcgY2hhbmdlIG11c3QgaGFwcGVucyBiZWZvcmUgdGhlICdzdGF0ZScgY2hhbmdlIHNvIGJvdGhcclxuICAgICAgICBhcmUgc3VjY2Vzc2Z1bGx5IHVwZGF0ZWQuIEZvciB0aGF0LCBqdXN0IHNwZWNpZnkgJ2Rpc2FibGVkJyBiZWZvcmUgJ3N0YXRlJyBpbiB0aGUgYmluZGluZ3NcclxuICAgICAgICBkZWZpbml0aW9uLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy8gRGVwZW5kZW5jaWVzXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2Jvb3RzdHJhcCcpO1xyXG5yZXF1aXJlKCdib290c3RyYXAtc3dpdGNoJyk7XHJcblxyXG4vKipcclxuICAgIENyZWF0ZSBhbmQgcGx1Zy1pbiB0aGUgQmluZGluZyBpbiB0aGUgcHJvdmlkZWQgS25vY2tvdXQgaW5zdGFuY2VcclxuKiovXHJcbmV4cG9ydHMucGx1Z0luID0gZnVuY3Rpb24gcGx1Z0luKGtvLCBwcmVmaXgpIHtcclxuXHJcbiAgICBrby5iaW5kaW5nSGFuZGxlcnNbcHJlZml4ID8gcHJlZml4ICsgJ3N3aXRjaCcgOiAnc3dpdGNoJ10gPSB7XHJcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oZWxlbWVudCwgdmFsdWVBY2Nlc3Nvcikge1xyXG4gICAgICAgICAgICAvLyBDcmVhdGUgcGx1Z2luIGluc3RhbmNlXHJcbiAgICAgICAgICAgICQoZWxlbWVudCkuYm9vdHN0cmFwU3dpdGNoKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzd2l0Y2ggaW5pdCcsIGtvLnRvSlModmFsdWVBY2Nlc3NvcigpKSk7XHJcblxyXG4gICAgICAgICAgICAvLyBVcGRhdGluZyB2YWx1ZSBvbiBwbHVnaW4gY2hhbmdlc1xyXG4gICAgICAgICAgICAkKGVsZW1lbnQpLm9uKCdzd2l0Y2hDaGFuZ2UuYm9vdHN0cmFwU3dpdGNoJywgZnVuY3Rpb24gKGUsIHN0YXRlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHZhbHVlQWNjZXNzb3IoKSB8fCB7fTtcclxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3N3aXRjaENoYW5nZScsIGtvLnRvSlModikpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBjaGFuZ2VkP1xyXG4gICAgICAgICAgICAgICAgdmFyIG9sZFN0YXRlID0gISFrby51bndyYXAodi5zdGF0ZSksXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3U3RhdGUgPSAhIXN0YXRlO1xyXG4gICAgICAgICAgICAgICAgLy8gT25seSB1cGRhdGUgb24gY2hhbmdlXHJcbiAgICAgICAgICAgICAgICBpZiAob2xkU3RhdGUgIT09IG5ld1N0YXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtvLmlzT2JzZXJ2YWJsZSh2LnN0YXRlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoa28uaXNXcml0ZWFibGVPYnNlcnZhYmxlKHYuc3RhdGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2LnN0YXRlKG5ld1N0YXRlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHYuc3RhdGUgPSBuZXdTdGF0ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZUFjY2Vzc29yKSB7XHJcbiAgICAgICAgICAgIC8vIEdldCBvcHRpb25zIHRvIGJlIGFwcGxpZWQgdG8gdGhlIHBsdWdpbiBpbnN0YW5jZVxyXG4gICAgICAgICAgICB2YXIgc3JjT3B0aW9ucyA9IHZhbHVlQWNjZXNzb3IoKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gc3JjT3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgICAgIC8vIFVud3JhcHBpbmcgZXZlcnkgb3B0aW9uIHZhbHVlLCBnZXR0aW5nIGEgZHVwbGljYXRlZFxyXG4gICAgICAgICAgICAvLyBwbGFpbiBvYmplY3RcclxuICAgICAgICAgICAgb3B0aW9ucyA9IGtvLnRvSlMob3B0aW9ucyk7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3N3aXRjaCB1cGRhdGUnLCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgICAgIHZhciAkZWwgPSAkKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICAvLyBVcGRhdGUgZXZlcnkgb3B0aW9uIGluIHRoZSBwbHVnaW5cclxuICAgICAgICAgICAgT2JqZWN0LmtleXMob3B0aW9ucykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgICAgICRlbC5ib290c3RyYXBTd2l0Y2goa2V5LCBvcHRpb25zW2tleV0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG4iLCIvKipcclxuICAgIEVzcGFjZSBhIHN0cmluZyBmb3IgdXNlIG9uIGEgUmVnRXhwLlxyXG4gICAgVXN1YWxseSwgdG8gbG9vayBmb3IgYSBzdHJpbmcgaW4gYSB0ZXh0IG11bHRpcGxlIHRpbWVzXHJcbiAgICBvciB3aXRoIHNvbWUgZXhwcmVzc2lvbnMsIHNvbWUgY29tbW9uIGFyZSBcclxuICAgIGxvb2sgZm9yIGEgdGV4dCAnaW4gdGhlIGJlZ2lubmluZycgKF4pXHJcbiAgICBvciAnYXQgdGhlIGVuZCcgKCQpLlxyXG4gICAgXHJcbiAgICBBdXRob3I6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS91c2Vycy8xNTEzMTIvY29vbGFqODYgYW5kIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS91c2Vycy85NDEwL2FyaXN0b3RsZS1wYWdhbHR6aXNcclxuICAgIExpbms6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzY5Njk0ODZcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbi8vIFJlZmVycmluZyB0byB0aGUgdGFibGUgaGVyZTpcclxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvcmVnZXhwXHJcbi8vIHRoZXNlIGNoYXJhY3RlcnMgc2hvdWxkIGJlIGVzY2FwZWRcclxuLy8gXFwgXiAkICogKyA/IC4gKCApIHwgeyB9IFsgXVxyXG4vLyBUaGVzZSBjaGFyYWN0ZXJzIG9ubHkgaGF2ZSBzcGVjaWFsIG1lYW5pbmcgaW5zaWRlIG9mIGJyYWNrZXRzXHJcbi8vIHRoZXkgZG8gbm90IG5lZWQgdG8gYmUgZXNjYXBlZCwgYnV0IHRoZXkgTUFZIGJlIGVzY2FwZWRcclxuLy8gd2l0aG91dCBhbnkgYWR2ZXJzZSBlZmZlY3RzICh0byB0aGUgYmVzdCBvZiBteSBrbm93bGVkZ2UgYW5kIGNhc3VhbCB0ZXN0aW5nKVxyXG4vLyA6ICEgLCA9IFxyXG4vLyBteSB0ZXN0IFwifiFAIyQlXiYqKCl7fVtdYC89PytcXHwtXzs6J1xcXCIsPC4+XCIubWF0Y2goL1tcXCNdL2cpXHJcblxyXG52YXIgc3BlY2lhbHMgPSBbXHJcbiAgICAvLyBvcmRlciBtYXR0ZXJzIGZvciB0aGVzZVxyXG4gICAgICBcIi1cIlxyXG4gICAgLCBcIltcIlxyXG4gICAgLCBcIl1cIlxyXG4gICAgLy8gb3JkZXIgZG9lc24ndCBtYXR0ZXIgZm9yIGFueSBvZiB0aGVzZVxyXG4gICAgLCBcIi9cIlxyXG4gICAgLCBcIntcIlxyXG4gICAgLCBcIn1cIlxyXG4gICAgLCBcIihcIlxyXG4gICAgLCBcIilcIlxyXG4gICAgLCBcIipcIlxyXG4gICAgLCBcIitcIlxyXG4gICAgLCBcIj9cIlxyXG4gICAgLCBcIi5cIlxyXG4gICAgLCBcIlxcXFxcIlxyXG4gICAgLCBcIl5cIlxyXG4gICAgLCBcIiRcIlxyXG4gICAgLCBcInxcIlxyXG4gIF1cclxuXHJcbiAgLy8gSSBjaG9vc2UgdG8gZXNjYXBlIGV2ZXJ5IGNoYXJhY3RlciB3aXRoICdcXCdcclxuICAvLyBldmVuIHRob3VnaCBvbmx5IHNvbWUgc3RyaWN0bHkgcmVxdWlyZSBpdCB3aGVuIGluc2lkZSBvZiBbXVxyXG4sIHJlZ2V4ID0gUmVnRXhwKCdbJyArIHNwZWNpYWxzLmpvaW4oJ1xcXFwnKSArICddJywgJ2cnKVxyXG47XHJcblxyXG52YXIgZXNjYXBlUmVnRXhwID0gZnVuY3Rpb24gKHN0cikge1xyXG5yZXR1cm4gc3RyLnJlcGxhY2UocmVnZXgsIFwiXFxcXCQmXCIpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBlc2NhcGVSZWdFeHA7XHJcblxyXG4vLyB0ZXN0IGVzY2FwZVJlZ0V4cChcIi9wYXRoL3RvL3Jlcz9zZWFyY2g9dGhpcy50aGF0XCIpXHJcbiIsIi8qKlxyXG4qIGVzY2FwZVNlbGVjdG9yXHJcbipcclxuKiBzb3VyY2U6IGh0dHA6Ly9ranZhcmdhLmJsb2dzcG90LmNvbS5lcy8yMDA5LzA2L2pxdWVyeS1wbHVnaW4tdG8tZXNjYXBlLWNzcy1zZWxlY3Rvci5odG1sXHJcbipcclxuKiBFc2NhcGUgYWxsIHNwZWNpYWwgalF1ZXJ5IENTUyBzZWxlY3RvciBjaGFyYWN0ZXJzIGluICpzZWxlY3RvciouXHJcbiogVXNlZnVsIHdoZW4geW91IGhhdmUgYSBjbGFzcyBvciBpZCB3aGljaCBjb250YWlucyBzcGVjaWFsIGNoYXJhY3RlcnNcclxuKiB3aGljaCB5b3UgbmVlZCB0byBpbmNsdWRlIGluIGEgc2VsZWN0b3IuXHJcbiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBzcGVjaWFscyA9IFtcclxuICAnIycsICcmJywgJ34nLCAnPScsICc+JywgXHJcbiAgXCInXCIsICc6JywgJ1wiJywgJyEnLCAnOycsICcsJ1xyXG5dO1xyXG52YXIgcmVnZXhTcGVjaWFscyA9IFtcclxuICAnLicsICcqJywgJysnLCAnfCcsICdbJywgJ10nLCAnKCcsICcpJywgJy8nLCAnXicsICckJ1xyXG5dO1xyXG52YXIgc1JFID0gbmV3IFJlZ0V4cChcclxuICAnKCcgKyBzcGVjaWFscy5qb2luKCd8JykgKyAnfFxcXFwnICsgcmVnZXhTcGVjaWFscy5qb2luKCd8XFxcXCcpICsgJyknLCAnZydcclxuKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICByZXR1cm4gc2VsZWN0b3IucmVwbGFjZShzUkUsICdcXFxcJDEnKTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBHZXQgYSBnaXZlbiB2YWx1ZSB3cmFwcGVkIGluIGFuIG9ic2VydmFibGUgb3IgcmV0dXJuc1xyXG4gICAgaXQgaWYgaXRzIGFscmVhZHkgYW4gb2JzZXJ2YWJsZSBvciBqdXN0IGEgZnVuY3Rpb24uXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldE9ic2VydmFibGUob2JzT3JWYWx1ZSkge1xyXG4gICAgaWYgKHR5cGVvZihvYnNPclZhbHVlKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICByZXR1cm4gb2JzT3JWYWx1ZTtcclxuICAgIGVsc2VcclxuICAgICAgICByZXR1cm4ga28ub2JzZXJ2YWJsZShvYnNPclZhbHVlKTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBSZWFkIGEgcGFnZSdzIEdFVCBVUkwgdmFyaWFibGVzIGFuZCByZXR1cm4gdGhlbSBhcyBhbiBhc3NvY2lhdGl2ZSBhcnJheS5cclxuKiovXHJcbid1c2VyIHN0cmljdCc7XHJcbi8vZ2xvYmFsIHdpbmRvd1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZXRVcmxRdWVyeSh1cmwpIHtcclxuXHJcbiAgICB1cmwgPSB1cmwgfHwgd2luZG93LmxvY2F0aW9uLmhyZWY7XHJcblxyXG4gICAgdmFyIHZhcnMgPSBbXSwgaGFzaCxcclxuICAgICAgICBxdWVyeUluZGV4ID0gdXJsLmluZGV4T2YoJz8nKTtcclxuICAgIGlmIChxdWVyeUluZGV4ID4gLTEpIHtcclxuICAgICAgICB2YXIgaGFzaGVzID0gdXJsLnNsaWNlKHF1ZXJ5SW5kZXggKyAxKS5zcGxpdCgnJicpO1xyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBoYXNoZXMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBoYXNoID0gaGFzaGVzW2ldLnNwbGl0KCc9Jyk7XHJcbiAgICAgICAgICAgIHZhcnMucHVzaChoYXNoWzBdKTtcclxuICAgICAgICAgICAgdmFyc1toYXNoWzBdXSA9IGhhc2hbMV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhcnM7XHJcbn07XHJcbiIsIi8vIGpRdWVyeSBwbHVnaW4gdG8gc2V0IG11bHRpbGluZSB0ZXh0IGluIGFuIGVsZW1lbnQsXHJcbi8vIGJ5IHJlcGxhY2luZyBcXG4gYnkgPGJyLz4gd2l0aCBjYXJlZnVsIHRvIGF2b2lkIFhTUyBhdHRhY2tzLlxyXG4vLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xMzA4MjAyOFxyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuJC5mbi5tdWx0aWxpbmUgPSBmdW5jdGlvbih0ZXh0KSB7XHJcbiAgICB0aGlzLnRleHQodGV4dCk7XHJcbiAgICB0aGlzLmh0bWwodGhpcy5odG1sKCkucmVwbGFjZSgvXFxuL2csJzxici8+JykpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgU2V0IG9mIHV0aWxpdGllcyB0byBkZWZpbmUgSmF2YXNjcmlwdCBQcm9wZXJ0aWVzXHJcbiAgICBpbmRlcGVuZGVudGx5IG9mIHRoZSBicm93c2VyLlxyXG4gICAgXHJcbiAgICBBbGxvd3MgdG8gZGVmaW5lIGdldHRlcnMgYW5kIHNldHRlcnMuXHJcbiAgICBcclxuICAgIEFkYXB0ZWQgY29kZSBmcm9tIHRoZSBvcmlnaW5hbCBjcmVhdGVkIGJ5IEplZmYgV2FsZGVuXHJcbiAgICBodHRwOi8vd2hlcmVzd2FsZGVuLmNvbS8yMDEwLzA0LzE2L21vcmUtc3BpZGVybW9ua2V5LWNoYW5nZXMtYW5jaWVudC1lc290ZXJpYy12ZXJ5LXJhcmVseS11c2VkLXN5bnRheC1mb3ItY3JlYXRpbmctZ2V0dGVycy1hbmQtc2V0dGVycy1pcy1iZWluZy1yZW1vdmVkL1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gYWNjZXNzb3JEZXNjcmlwdG9yKGZpZWxkLCBmdW4pXHJcbntcclxuICAgIHZhciBkZXNjID0geyBlbnVtZXJhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfTtcclxuICAgIGRlc2NbZmllbGRdID0gZnVuO1xyXG4gICAgcmV0dXJuIGRlc2M7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRlZmluZUdldHRlcihvYmosIHByb3AsIGdldClcclxue1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSlcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgcHJvcCwgYWNjZXNzb3JEZXNjcmlwdG9yKFwiZ2V0XCIsIGdldCkpO1xyXG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuX19kZWZpbmVHZXR0ZXJfXylcclxuICAgICAgICByZXR1cm4gb2JqLl9fZGVmaW5lR2V0dGVyX18ocHJvcCwgZ2V0KTtcclxuXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgZ2V0dGVyc1wiKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZGVmaW5lU2V0dGVyKG9iaiwgcHJvcCwgc2V0KVxyXG57XHJcbiAgICBpZiAoT2JqZWN0LmRlZmluZVByb3BlcnR5KVxyXG4gICAgICAgIHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBwcm9wLCBhY2Nlc3NvckRlc2NyaXB0b3IoXCJzZXRcIiwgc2V0KSk7XHJcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5fX2RlZmluZVNldHRlcl9fKVxyXG4gICAgICAgIHJldHVybiBvYmouX19kZWZpbmVTZXR0ZXJfXyhwcm9wLCBzZXQpO1xyXG5cclxuICAgIHRocm93IG5ldyBFcnJvcihcImJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBzZXR0ZXJzXCIpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGRlZmluZUdldHRlcjogZGVmaW5lR2V0dGVyLFxyXG4gICAgZGVmaW5lU2V0dGVyOiBkZWZpbmVTZXR0ZXJcclxufTtcclxuIiwiLyoqXHJcbiAgICBEb21JdGVtc01hbmFnZXIgY2xhc3MsIHRoYXQgbWFuYWdlIGEgY29sbGVjdGlvbiBcclxuICAgIG9mIEhUTUwvRE9NIGl0ZW1zIHVuZGVyIGEgcm9vdC9jb250YWluZXIsIHdoZXJlXHJcbiAgICBvbmx5IG9uZSBlbGVtZW50IGF0IHRoZSB0aW1lIGlzIHZpc2libGUsIHByb3ZpZGluZ1xyXG4gICAgdG9vbHMgdG8gdW5pcXVlcmx5IGlkZW50aWZ5IHRoZSBpdGVtcyxcclxuICAgIHRvIGNyZWF0ZSBvciB1cGRhdGUgbmV3IGl0ZW1zICh0aHJvdWdoICdpbmplY3QnKSxcclxuICAgIGdldCB0aGUgY3VycmVudCwgZmluZCBieSB0aGUgSUQgYW5kIG1vcmUuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgZXNjYXBlU2VsZWN0b3IgPSByZXF1aXJlKCcuLi9lc2NhcGVTZWxlY3RvcicpO1xyXG5cclxuZnVuY3Rpb24gRG9tSXRlbXNNYW5hZ2VyKHNldHRpbmdzKSB7XHJcblxyXG4gICAgdGhpcy5pZEF0dHJpYnV0ZU5hbWUgPSBzZXR0aW5ncy5pZEF0dHJpYnV0ZU5hbWUgfHwgJ2lkJztcclxuICAgIHRoaXMuYWxsb3dEdXBsaWNhdGVzID0gISFzZXR0aW5ncy5hbGxvd0R1cGxpY2F0ZXMgfHwgZmFsc2U7XHJcbiAgICB0aGlzLiRyb290ID0gbnVsbDtcclxuICAgIC8vIE9uIHBhZ2UgcmVhZHksIGdldCB0aGUgcm9vdCBlbGVtZW50OlxyXG4gICAgJChmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLiRyb290ID0gJChzZXR0aW5ncy5yb290IHx8ICdib2R5Jyk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IERvbUl0ZW1zTWFuYWdlcjtcclxuXHJcbkRvbUl0ZW1zTWFuYWdlci5wcm90b3R5cGUuZmluZCA9IGZ1bmN0aW9uIGZpbmQoY29udGFpbmVyTmFtZSwgcm9vdCkge1xyXG4gICAgdmFyICRyb290ID0gJChyb290IHx8IHRoaXMuJHJvb3QpO1xyXG4gICAgcmV0dXJuICRyb290LmZpbmQoJ1snICsgdGhpcy5pZEF0dHJpYnV0ZU5hbWUgKyAnPVwiJyArIGVzY2FwZVNlbGVjdG9yKGNvbnRhaW5lck5hbWUpICsgJ1wiXScpO1xyXG59O1xyXG5cclxuRG9tSXRlbXNNYW5hZ2VyLnByb3RvdHlwZS5nZXRBY3RpdmUgPSBmdW5jdGlvbiBnZXRBY3RpdmUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy4kcm9vdC5maW5kKCdbJyArIHRoaXMuaWRBdHRyaWJ1dGVOYW1lICsgJ106dmlzaWJsZScpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBJdCBhZGRzIHRoZSBpdGVtIGluIHRoZSBodG1sIHByb3ZpZGVkIChjYW4gYmUgb25seSB0aGUgZWxlbWVudCBvciBcclxuICAgIGNvbnRhaW5lZCBpbiBhbm90aGVyIG9yIGEgZnVsbCBodG1sIHBhZ2UpLlxyXG4gICAgUmVwbGFjZXMgYW55IGV4aXN0YW50IGlmIGR1cGxpY2F0ZXMgYXJlIG5vdCBhbGxvd2VkLlxyXG4qKi9cclxuRG9tSXRlbXNNYW5hZ2VyLnByb3RvdHlwZS5pbmplY3QgPSBmdW5jdGlvbiBpbmplY3QobmFtZSwgaHRtbCkge1xyXG5cclxuICAgIC8vIEZpbHRlcmluZyBpbnB1dCBodG1sIChjYW4gYmUgcGFydGlhbCBvciBmdWxsIHBhZ2VzKVxyXG4gICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTI4NDg3OThcclxuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoL15bXFxzXFxTXSo8Ym9keS4qPz58PFxcL2JvZHk+W1xcc1xcU10qJC9nLCAnJyk7XHJcblxyXG4gICAgLy8gQ3JlYXRpbmcgYSB3cmFwcGVyIGFyb3VuZCB0aGUgaHRtbFxyXG4gICAgLy8gKGNhbiBiZSBwcm92aWRlZCB0aGUgaW5uZXJIdG1sIG9yIG91dGVySHRtbCwgZG9lc24ndCBtYXR0ZXJzIHdpdGggbmV4dCBhcHByb2FjaClcclxuICAgIHZhciAkaHRtbCA9ICQoJzxkaXYvPicsIHsgaHRtbDogaHRtbCB9KSxcclxuICAgICAgICAvLyBXZSBsb29rIGZvciB0aGUgY29udGFpbmVyIGVsZW1lbnQgKHdoZW4gdGhlIG91dGVySHRtbCBpcyBwcm92aWRlZClcclxuICAgICAgICAkYyA9IHRoaXMuZmluZChuYW1lLCAkaHRtbCk7XHJcblxyXG4gICAgaWYgKCRjLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIC8vIEl0cyBpbm5lckh0bWwsIHNvIHRoZSB3cmFwcGVyIGJlY29tZXMgdGhlIGNvbnRhaW5lciBpdHNlbGZcclxuICAgICAgICAkYyA9ICRodG1sLmF0dHIodGhpcy5pZEF0dHJpYnV0ZU5hbWUsIG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5hbGxvd0R1cGxpY2F0ZXMpIHtcclxuICAgICAgICAvLyBObyBtb3JlIHRoYW4gb25lIGNvbnRhaW5lciBpbnN0YW5jZSBjYW4gZXhpc3RzIGF0IHRoZSBzYW1lIHRpbWVcclxuICAgICAgICAvLyBXZSBsb29rIGZvciBhbnkgZXhpc3RlbnQgb25lIGFuZCBpdHMgcmVwbGFjZWQgd2l0aCB0aGUgbmV3XHJcbiAgICAgICAgdmFyICRwcmV2ID0gdGhpcy5maW5kKG5hbWUpO1xyXG4gICAgICAgIGlmICgkcHJldi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICRwcmV2LnJlcGxhY2VXaXRoKCRjKTtcclxuICAgICAgICAgICAgJGMgPSAkcHJldjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWRkIHRvIHRoZSBkb2N1bWVudFxyXG4gICAgLy8gKG9uIHRoZSBjYXNlIG9mIGR1cGxpY2F0ZWQgZm91bmQsIHRoaXMgd2lsbCBkbyBub3RoaW5nLCBubyB3b3JyeSlcclxuICAgICRjLmFwcGVuZFRvKHRoaXMuJHJvb3QpO1xyXG59O1xyXG5cclxuLyoqIFxyXG4gICAgVGhlIHN3aXRjaCBtZXRob2QgcmVjZWl2ZSB0aGUgaXRlbXMgdG8gaW50ZXJjaGFuZ2UgYXMgYWN0aXZlIG9yIGN1cnJlbnQsXHJcbiAgICB0aGUgJ2Zyb20nIGFuZCAndG8nLCBhbmQgdGhlIHNoZWxsIGluc3RhbmNlIHRoYXQgTVVTVCBiZSB1c2VkXHJcbiAgICB0byBub3RpZnkgZWFjaCBldmVudCB0aGF0IGludm9sdmVzIHRoZSBpdGVtOlxyXG4gICAgd2lsbENsb3NlLCB3aWxsT3BlbiwgcmVhZHksIG9wZW5lZCwgY2xvc2VkLlxyXG4gICAgSXQgcmVjZWl2ZXMgYXMgbGF0ZXN0IHBhcmFtZXRlciB0aGUgJ25vdGlmaWNhdGlvbicgb2JqZWN0IHRoYXQgbXVzdCBiZVxyXG4gICAgcGFzc2VkIHdpdGggdGhlIGV2ZW50IHNvIGhhbmRsZXJzIGhhcyBjb250ZXh0IHN0YXRlIGluZm9ybWF0aW9uLlxyXG4gICAgXHJcbiAgICBJdCdzIGRlc2lnbmVkIHRvIGJlIGFibGUgdG8gbWFuYWdlIHRyYW5zaXRpb25zLCBidXQgdGhpcyBkZWZhdWx0XHJcbiAgICBpbXBsZW1lbnRhdGlvbiBpcyBhcyBzaW1wbGUgYXMgJ3Nob3cgdGhlIG5ldyBhbmQgaGlkZSB0aGUgb2xkJy5cclxuKiovXHJcbkRvbUl0ZW1zTWFuYWdlci5wcm90b3R5cGUuc3dpdGNoID0gZnVuY3Rpb24gc3dpdGNoQWN0aXZlSXRlbSgkZnJvbSwgJHRvLCBzaGVsbCwgbm90aWZpY2F0aW9uKSB7XHJcblxyXG4gICAgaWYgKCEkdG8uaXMoJzp2aXNpYmxlJykpIHtcclxuICAgICAgICBzaGVsbC5lbWl0KHNoZWxsLmV2ZW50cy53aWxsT3BlbiwgJHRvLCBub3RpZmljYXRpb24pO1xyXG4gICAgICAgICR0by5zaG93KCk7XHJcbiAgICAgICAgLy8gSXRzIGVub3VnaCB2aXNpYmxlIGFuZCBpbiBET00gdG8gcGVyZm9ybSBpbml0aWFsaXphdGlvbiB0YXNrc1xyXG4gICAgICAgIC8vIHRoYXQgbWF5IGludm9sdmUgbGF5b3V0IGluZm9ybWF0aW9uXHJcbiAgICAgICAgc2hlbGwuZW1pdChzaGVsbC5ldmVudHMuaXRlbVJlYWR5LCAkdG8sIG5vdGlmaWNhdGlvbik7XHJcbiAgICAgICAgLy8gV2hlbiBpdHMgY29tcGxldGVseSBvcGVuZWRcclxuICAgICAgICBzaGVsbC5lbWl0KHNoZWxsLmV2ZW50cy5vcGVuZWQsICR0bywgbm90aWZpY2F0aW9uKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gSXRzIHJlYWR5OyBtYXliZSBpdCB3YXMgYnV0IHN1Yi1sb2NhdGlvblxyXG4gICAgICAgIC8vIG9yIHN0YXRlIGNoYW5nZSBuZWVkIHRvIGJlIGNvbW11bmljYXRlZFxyXG4gICAgICAgIHNoZWxsLmVtaXQoc2hlbGwuZXZlbnRzLml0ZW1SZWFkeSwgJHRvLCBub3RpZmljYXRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICgkZnJvbS5pcygnOnZpc2libGUnKSkge1xyXG4gICAgICAgIHNoZWxsLmVtaXQoc2hlbGwuZXZlbnRzLndpbGxDbG9zZSwgJGZyb20sIG5vdGlmaWNhdGlvbik7XHJcbiAgICAgICAgLy8gRG8gJ3VuZm9jdXMnIG9uIHRoZSBoaWRkZW4gZWxlbWVudCBhZnRlciBub3RpZnkgJ3dpbGxDbG9zZSdcclxuICAgICAgICAvLyBmb3IgYmV0dGVyIFVYOiBoaWRkZW4gZWxlbWVudHMgYXJlIG5vdCByZWFjaGFibGUgYW5kIGhhcyBnb29kXHJcbiAgICAgICAgLy8gc2lkZSBlZmZlY3RzIGxpa2UgaGlkZGluZyB0aGUgb24tc2NyZWVuIGtleWJvYXJkIGlmIGFuIGlucHV0IHdhc1xyXG4gICAgICAgIC8vIGZvY3VzZWRcclxuICAgICAgICAkZnJvbS5maW5kKCc6Zm9jdXMnKS5ibHVyKCk7XHJcbiAgICAgICAgLy8gaGlkZSBhbmQgbm90aWZ5IGl0IGVuZGVkXHJcbiAgICAgICAgJGZyb20uaGlkZSgpO1xyXG4gICAgICAgIHNoZWxsLmVtaXQoc2hlbGwuZXZlbnRzLmNsb3NlZCwgJGZyb20sIG5vdGlmaWNhdGlvbik7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICAgIEluaXRpYWxpemVzIHRoZSBsaXN0IG9mIGl0ZW1zLiBObyBtb3JlIHRoYW4gb25lXHJcbiAgICBtdXN0IGJlIG9wZW5lZC92aXNpYmxlIGF0IHRoZSBzYW1lIHRpbWUsIHNvIGF0IHRoZSBcclxuICAgIGluaXQgYWxsIHRoZSBlbGVtZW50cyBhcmUgY2xvc2VkIHdhaXRpbmcgdG8gc2V0XHJcbiAgICBvbmUgYXMgdGhlIGFjdGl2ZSBvciB0aGUgY3VycmVudCBvbmUuXHJcbioqL1xyXG5Eb21JdGVtc01hbmFnZXIucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiBpbml0KCkge1xyXG4gICAgdGhpcy5nZXRBY3RpdmUoKS5oaWRlKCk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgSmF2YXNjcml0cCBTaGVsbCBmb3IgU1BBcy5cclxuKiovXHJcbi8qZ2xvYmFsIHdpbmRvdywgZG9jdW1lbnQgKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqIERJIGVudHJ5IHBvaW50cyBmb3IgZGVmYXVsdCBidWlsZHMuIE1vc3QgZGVwZW5kZW5jaWVzIGNhbiBiZVxyXG4gICAgc3BlY2lmaWVkIGluIHRoZSBjb25zdHJ1Y3RvciBzZXR0aW5ncyBmb3IgcGVyLWluc3RhbmNlIHNldHVwLlxyXG4qKi9cclxudmFyIGRlcHMgPSByZXF1aXJlKCcuL2RlcGVuZGVuY2llcycpO1xyXG5cclxuLyoqIENvbnN0cnVjdG9yICoqL1xyXG5cclxuZnVuY3Rpb24gU2hlbGwoc2V0dGluZ3MpIHtcclxuICAgIC8vanNoaW50IG1heGNvbXBsZXhpdHk6MTRcclxuICAgIFxyXG4gICAgZGVwcy5FdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLiQgPSBzZXR0aW5ncy5qcXVlcnkgfHwgZGVwcy5qcXVlcnk7XHJcbiAgICB0aGlzLiRyb290ID0gdGhpcy4kKHNldHRpbmdzLnJvb3QpO1xyXG4gICAgdGhpcy5iYXNlVXJsID0gc2V0dGluZ3MuYmFzZVVybCB8fCAnJztcclxuICAgIC8vIFdpdGggZm9yY2VIYXNoYmFuZz10cnVlOlxyXG4gICAgLy8gLSBmcmFnbWVudHMgVVJMcyBjYW5ub3QgYmUgdXNlZCB0byBzY3JvbGwgdG8gYW4gZWxlbWVudCAoZGVmYXVsdCBicm93c2VyIGJlaGF2aW9yKSxcclxuICAgIC8vICAgdGhleSBhcmUgZGVmYXVsdFByZXZlbnRlZCB0byBhdm9pZCBjb25mdXNlIHRoZSByb3V0aW5nIG1lY2hhbmlzbSBhbmQgY3VycmVudCBVUkwuXHJcbiAgICAvLyAtIHByZXNzZWQgbGlua3MgdG8gZnJhZ21lbnRzIFVSTHMgYXJlIG5vdCByb3V0ZWQsIHRoZXkgYXJlIHNraXBwZWQgc2lsZW50bHlcclxuICAgIC8vICAgZXhjZXB0IHdoZW4gdGhleSBhcmUgYSBoYXNoYmFuZyAoIyEpLiBUaGlzIHdheSwgc3BlY2lhbCBsaW5rc1xyXG4gICAgLy8gICB0aGF0IHBlcmZvcm1uIGpzIGFjdGlvbnMgZG9lc24ndCBjb25mbGl0cy5cclxuICAgIC8vIC0gYWxsIFVSTHMgcm91dGVkIHRocm91Z2ggdGhlIHNoZWxsIGluY2x1ZGVzIGEgaGFzaGJhbmcgKCMhKSwgdGhlIHNoZWxsIGVuc3VyZXNcclxuICAgIC8vICAgdGhhdCBoYXBwZW5zIGJ5IGFwcGVuZGluZyB0aGUgaGFzaGJhbmcgdG8gYW55IFVSTCBwYXNzZWQgaW4gKGV4Y2VwdCB0aGUgc3RhbmRhcmQgaGFzaFxyXG4gICAgLy8gICB0aGF0IGFyZSBza2lwdCkuXHJcbiAgICB0aGlzLmZvcmNlSGFzaGJhbmcgPSBzZXR0aW5ncy5mb3JjZUhhc2hiYW5nIHx8IGZhbHNlO1xyXG4gICAgdGhpcy5saW5rRXZlbnQgPSBzZXR0aW5ncy5saW5rRXZlbnQgfHwgJ2NsaWNrJztcclxuICAgIHRoaXMucGFyc2VVcmwgPSAoc2V0dGluZ3MucGFyc2VVcmwgfHwgZGVwcy5wYXJzZVVybCkuYmluZCh0aGlzLCB0aGlzLmJhc2VVcmwpO1xyXG4gICAgdGhpcy5hYnNvbHV0aXplVXJsID0gKHNldHRpbmdzLmFic29sdXRpemVVcmwgfHwgZGVwcy5hYnNvbHV0aXplVXJsKS5iaW5kKHRoaXMsIHRoaXMuYmFzZVVybCk7XHJcblxyXG4gICAgdGhpcy5oaXN0b3J5ID0gc2V0dGluZ3MuaGlzdG9yeSB8fCB3aW5kb3cuaGlzdG9yeTtcclxuXHJcbiAgICB0aGlzLmluZGV4TmFtZSA9IHNldHRpbmdzLmluZGV4TmFtZSB8fCAnaW5kZXgnO1xyXG4gICAgXHJcbiAgICB0aGlzLml0ZW1zID0gc2V0dGluZ3MuZG9tSXRlbXNNYW5hZ2VyO1xyXG5cclxuICAgIC8vIGxvYWRlciBjYW4gYmUgZGlzYWJsZWQgcGFzc2luZyAnbnVsbCcsIHNvIHdlIG11c3RcclxuICAgIC8vIGVuc3VyZSB0byBub3QgdXNlIHRoZSBkZWZhdWx0IG9uIHRoYXQgY2FzZXM6XHJcbiAgICB0aGlzLmxvYWRlciA9IHR5cGVvZihzZXR0aW5ncy5sb2FkZXIpID09PSAndW5kZWZpbmVkJyA/IGRlcHMubG9hZGVyIDogc2V0dGluZ3MubG9hZGVyO1xyXG4gICAgLy8gbG9hZGVyIHNldHVwXHJcbiAgICBpZiAodGhpcy5sb2FkZXIpXHJcbiAgICAgICAgdGhpcy5sb2FkZXIuYmFzZVVybCA9IHRoaXMuYmFzZVVybDtcclxuXHJcbiAgICAvLyBEZWZpbml0aW9uIG9mIGV2ZW50cyB0aGF0IHRoaXMgb2JqZWN0IGNhbiB0cmlnZ2VyLFxyXG4gICAgLy8gaXRzIHZhbHVlIGNhbiBiZSBjdXN0b21pemVkIGJ1dCBhbnkgbGlzdGVuZXIgbmVlZHNcclxuICAgIC8vIHRvIGtlZXAgdXBkYXRlZCB0byB0aGUgY29ycmVjdCBldmVudCBzdHJpbmctbmFtZSB1c2VkLlxyXG4gICAgLy8gVGhlIGl0ZW1zIG1hbmlwdWxhdGlvbiBldmVudHMgTVVTVCBiZSB0cmlnZ2VyZWRcclxuICAgIC8vIGJ5IHRoZSAnaXRlbXMuc3dpdGNoJyBmdW5jdGlvblxyXG4gICAgdGhpcy5ldmVudHMgPSB7XHJcbiAgICAgICAgd2lsbE9wZW46ICdzaGVsbC13aWxsLW9wZW4nLFxyXG4gICAgICAgIHdpbGxDbG9zZTogJ3NoZWxsLXdpbGwtY2xvc2UnLFxyXG4gICAgICAgIGl0ZW1SZWFkeTogJ3NoZWxsLWl0ZW0tcmVhZHknLFxyXG4gICAgICAgIGNsb3NlZDogJ3NoZWxsLWNsb3NlZCcsXHJcbiAgICAgICAgb3BlbmVkOiAnc2hlbGwtb3BlbmVkJ1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgQSBmdW5jdGlvbiB0byBkZWNpZGUgaWYgdGhlXHJcbiAgICAgICAgYWNjZXNzIGlzIGFsbG93ZWQgKHJldHVybnMgJ251bGwnKVxyXG4gICAgICAgIG9yIG5vdCAocmV0dXJuIGEgc3RhdGUgb2JqZWN0IHdpdGggaW5mb3JtYXRpb25cclxuICAgICAgICB0aGF0IHdpbGwgYmUgcGFzc2VkIHRvIHRoZSAnbm9uQWNjZXNzTmFtZScgaXRlbTtcclxuICAgICAgICB0aGUgJ3JvdXRlJyBwcm9wZXJ0eSBvbiB0aGUgc3RhdGUgaXMgYXV0b21hdGljYWxseSBmaWxsZWQpLlxyXG4gICAgICAgIFxyXG4gICAgICAgIFRoZSBkZWZhdWx0IGJ1aXQtaW4ganVzdCBhbGxvdyBldmVyeXRoaW5nIFxyXG4gICAgICAgIGJ5IGp1c3QgcmV0dXJuaW5nICdudWxsJyBhbGwgdGhlIHRpbWUuXHJcbiAgICAgICAgXHJcbiAgICAgICAgSXQgcmVjZWl2ZXMgYXMgcGFyYW1ldGVyIHRoZSBzdGF0ZSBvYmplY3QsXHJcbiAgICAgICAgdGhhdCBhbG1vc3QgY29udGFpbnMgdGhlICdyb3V0ZScgcHJvcGVydHkgd2l0aFxyXG4gICAgICAgIGluZm9ybWF0aW9uIGFib3V0IHRoZSBVUkwuXHJcbiAgICAqKi9cclxuICAgIHRoaXMuYWNjZXNzQ29udHJvbCA9IHNldHRpbmdzLmFjY2Vzc0NvbnRyb2wgfHwgZGVwcy5hY2Nlc3NDb250cm9sO1xyXG4gICAgLy8gV2hhdCBpdGVtIGxvYWQgb24gbm9uIGFjY2Vzc1xyXG4gICAgdGhpcy5ub25BY2Nlc3NOYW1lID0gc2V0dGluZ3Mubm9uQWNjZXNzTmFtZSB8fCAnaW5kZXgnO1xyXG59XHJcblxyXG4vLyBTaGVsbCBpbmhlcml0cyBmcm9tIEV2ZW50RW1pdHRlclxyXG5TaGVsbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGRlcHMuRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwge1xyXG4gICAgY29uc3RydWN0b3I6IHtcclxuICAgICAgICB2YWx1ZTogU2hlbGwsXHJcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXHJcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTaGVsbDtcclxuXHJcblxyXG4vKiogQVBJIGRlZmluaXRpb24gKiovXHJcblxyXG5TaGVsbC5wcm90b3R5cGUuZ28gPSBmdW5jdGlvbiBnbyh1cmwsIHN0YXRlKSB7XHJcblxyXG4gICAgaWYgKHRoaXMuZm9yY2VIYXNoYmFuZykge1xyXG4gICAgICAgIGlmICghL14jIS8udGVzdCh1cmwpKSB7XHJcbiAgICAgICAgICAgIHVybCA9ICcjIScgKyB1cmw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdXJsID0gdGhpcy5hYnNvbHV0aXplVXJsKHVybCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmhpc3RvcnkucHVzaFN0YXRlKHN0YXRlLCB1bmRlZmluZWQsIHVybCk7XHJcbiAgICAvLyBwdXNoU3RhdGUgZG8gTk9UIHRyaWdnZXIgdGhlIHBvcHN0YXRlIGV2ZW50LCBzb1xyXG4gICAgcmV0dXJuIHRoaXMucmVwbGFjZShzdGF0ZSk7XHJcbn07XHJcblxyXG5TaGVsbC5wcm90b3R5cGUuZ29CYWNrID0gZnVuY3Rpb24gZ29CYWNrKHN0YXRlLCBzdGVwcykge1xyXG4gICAgc3RlcHMgPSAwIC0gKHN0ZXBzIHx8IDEpO1xyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm90aGluZyB0byBnby1iYWNrIG9yIG5vdCBlbm91Z2h0XHJcbiAgICAvLyAnYmFjaycgc3RlcHMsIGdvIHRvIHRoZSBpbmRleFxyXG4gICAgaWYgKHN0ZXBzIDwgMCAmJiBNYXRoLmFicyhzdGVwcykgPj0gdGhpcy5oaXN0b3J5Lmxlbmd0aCkge1xyXG4gICAgICAgIHRoaXMuZ28odGhpcy5pbmRleE5hbWUpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgLy8gT24gcmVwbGFjZSwgdGhlIHBhc3NlZCBzdGF0ZSBpcyBtZXJnZWQgd2l0aFxyXG4gICAgICAgIC8vIHRoZSBvbmUgdGhhdCBjb21lcyBmcm9tIHRoZSBzYXZlZCBoaXN0b3J5XHJcbiAgICAgICAgLy8gZW50cnkgKGl0ICdwb3BzJyB3aGVuIGRvaW5nIHRoZSBoaXN0b3J5LmdvKCkpXHJcbiAgICAgICAgdGhpcy5fcGVuZGluZ1N0YXRlVXBkYXRlID0gc3RhdGU7XHJcbiAgICAgICAgdGhpcy5oaXN0b3J5LmdvKHN0ZXBzKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gICAgUHJvY2VzcyB0aGUgZ2l2ZW4gc3RhdGUgaW4gb3JkZXIgdG8gZ2V0IHRoZSBjdXJyZW50IHN0YXRlXHJcbiAgICBiYXNlZCBvbiB0aGF0IG9yIHRoZSBzYXZlZCBpbiBoaXN0b3J5LCBtZXJnZSBpdCB3aXRoXHJcbiAgICBhbnkgdXBkYXRlZCBzdGF0ZSBwZW5kaW5nIGFuZCBhZGRzIHRoZSByb3V0ZSBpbmZvcm1hdGlvbixcclxuICAgIHJldHVybmluZyBhbiBzdGF0ZSBvYmplY3Qgc3VpdGFibGUgdG8gdXNlLlxyXG4qKi9cclxuU2hlbGwucHJvdG90eXBlLmdldFVwZGF0ZWRTdGF0ZSA9IGZ1bmN0aW9uIGdldFVwZGF0ZWRTdGF0ZShzdGF0ZSkge1xyXG4gICAgLypqc2hpbnQgbWF4Y29tcGxleGl0eTogOCAqL1xyXG4gICAgXHJcbiAgICAvLyBGb3IgY3VycmVudCB1c2VzLCBhbnkgcGVuZGluZ1N0YXRlVXBkYXRlIGlzIHVzZWQgYXNcclxuICAgIC8vIHRoZSBzdGF0ZSwgcmF0aGVyIHRoYW4gdGhlIHByb3ZpZGVkIG9uZVxyXG4gICAgc3RhdGUgPSB0aGlzLl9wZW5kaW5nU3RhdGVVcGRhdGUgfHwgc3RhdGUgfHwgdGhpcy5oaXN0b3J5LnN0YXRlIHx8IHt9O1xyXG4gICAgXHJcbiAgICAvLyBUT0RPOiBtb3JlIGFkdmFuY2VkIHVzZXMgbXVzdCBiZSB0byB1c2UgdGhlICdzdGF0ZScgdG9cclxuICAgIC8vIHJlY292ZXIgdGhlIFVJIHN0YXRlLCB3aXRoIGFueSBtZXNzYWdlIGZyb20gb3RoZXIgVUlcclxuICAgIC8vIHBhc3NpbmcgaW4gYSB3YXkgdGhhdCBhbGxvdyB1cGRhdGUgdGhlIHN0YXRlLCBub3RcclxuICAgIC8vIHJlcGxhY2UgaXQgKGZyb20gcGVuZGluZ1N0YXRlVXBkYXRlKS5cclxuICAgIC8qXHJcbiAgICAvLyBTdGF0ZSBvciBkZWZhdWx0IHN0YXRlXHJcbiAgICBzdGF0ZSA9IHN0YXRlIHx8IHRoaXMuaGlzdG9yeS5zdGF0ZSB8fCB7fTtcclxuICAgIC8vIG1lcmdlIHBlbmRpbmcgdXBkYXRlZCBzdGF0ZVxyXG4gICAgdGhpcy4kLmV4dGVuZChzdGF0ZSwgdGhpcy5fcGVuZGluZ1N0YXRlVXBkYXRlKTtcclxuICAgIC8vIGRpc2NhcmQgdGhlIHVwZGF0ZVxyXG4gICAgKi9cclxuICAgIHRoaXMuX3BlbmRpbmdTdGF0ZVVwZGF0ZSA9IG51bGw7XHJcbiAgICBcclxuICAgIC8vIERvZXNuJ3QgbWF0dGVycyBpZiBzdGF0ZSBpbmNsdWRlcyBhbHJlYWR5IFxyXG4gICAgLy8gJ3JvdXRlJyBpbmZvcm1hdGlvbiwgbmVlZCB0byBiZSBvdmVyd3JpdHRlblxyXG4gICAgLy8gdG8gbWF0Y2ggdGhlIGN1cnJlbnQgb25lLlxyXG4gICAgLy8gTk9URTogcHJldmlvdXNseSwgYSBjaGVjayBwcmV2ZW50ZWQgdGhpcyBpZlxyXG4gICAgLy8gcm91dGUgcHJvcGVydHkgZXhpc3RzLCBjcmVhdGluZyBpbmZpbml0ZSBsb29wc1xyXG4gICAgLy8gb24gcmVkaXJlY3Rpb25zIGZyb20gYWN0aXZpdHkuc2hvdyBzaW5jZSAncm91dGUnIGRvZXNuJ3RcclxuICAgIC8vIG1hdGNoIHRoZSBuZXcgZGVzaXJlZCBsb2NhdGlvblxyXG4gICAgXHJcbiAgICAvLyBEZXRlY3QgaWYgaXMgYSBoYXNoYmFuZyBVUkwgb3IgYW4gc3RhbmRhcmQgb25lLlxyXG4gICAgLy8gRXhjZXB0IGlmIHRoZSBhcHAgaXMgZm9yY2VkIHRvIHVzZSBoYXNoYmFuZy5cclxuICAgIHZhciBpc0hhc2hCYW5nID0gLyMhLy50ZXN0KGxvY2F0aW9uLmhyZWYpIHx8IHRoaXMuZm9yY2VIYXNoYmFuZztcclxuICAgIFxyXG4gICAgdmFyIGxpbmsgPSAoXHJcbiAgICAgICAgaXNIYXNoQmFuZyA/XHJcbiAgICAgICAgbG9jYXRpb24uaGFzaCA6XHJcbiAgICAgICAgbG9jYXRpb24ucGF0aG5hbWVcclxuICAgICkgKyAobG9jYXRpb24uc2VhcmNoIHx8ICcnKTtcclxuICAgIFxyXG4gICAgLy8gU2V0IHRoZSByb3V0ZVxyXG4gICAgc3RhdGUucm91dGUgPSB0aGlzLnBhcnNlVXJsKGxpbmspO1xyXG4gICAgXHJcbiAgICByZXR1cm4gc3RhdGU7XHJcbn07XHJcblxyXG5TaGVsbC5wcm90b3R5cGUucmVwbGFjZSA9IGZ1bmN0aW9uIHJlcGxhY2Uoc3RhdGUpIHtcclxuICAgIFxyXG4gICAgc3RhdGUgPSB0aGlzLmdldFVwZGF0ZWRTdGF0ZShzdGF0ZSk7XHJcblxyXG4gICAgLy8gVXNlIHRoZSBpbmRleCBvbiByb290IGNhbGxzXHJcbiAgICBpZiAoc3RhdGUucm91dGUucm9vdCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIHN0YXRlLnJvdXRlID0gdGhpcy5wYXJzZVVybCh0aGlzLmluZGV4TmFtZSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEFjY2VzcyBjb250cm9sXHJcbiAgICB2YXIgYWNjZXNzRXJyb3IgPSB0aGlzLmFjY2Vzc0NvbnRyb2woc3RhdGUucm91dGUpO1xyXG4gICAgaWYgKGFjY2Vzc0Vycm9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ28odGhpcy5ub25BY2Nlc3NOYW1lLCBhY2Nlc3NFcnJvcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTG9jYXRpbmcgdGhlIGNvbnRhaW5lclxyXG4gICAgdmFyICRjb250ID0gdGhpcy5pdGVtcy5maW5kKHN0YXRlLnJvdXRlLm5hbWUpO1xyXG4gICAgdmFyIHNoZWxsID0gdGhpcztcclxuICAgIHZhciBwcm9taXNlID0gbnVsbDtcclxuXHJcbiAgICBpZiAoJGNvbnQgJiYgJGNvbnQubGVuZ3RoKSB7XHJcbiAgICAgICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciAkb2xkQ29udCA9IHNoZWxsLml0ZW1zLmdldEFjdGl2ZSgpO1xyXG4gICAgICAgICAgICAgICAgJG9sZENvbnQgPSAkb2xkQ29udC5ub3QoJGNvbnQpO1xyXG4gICAgICAgICAgICAgICAgc2hlbGwuaXRlbXMuc3dpdGNoKCRvbGRDb250LCAkY29udCwgc2hlbGwsIHN0YXRlKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7IC8vPyByZXNvbHZlKGFjdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoZXgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBpZiAodGhpcy5sb2FkZXIpIHtcclxuICAgICAgICAgICAgLy8gbG9hZCBhbmQgaW5qZWN0IHRoZSBjb250ZW50IGluIHRoZSBwYWdlXHJcbiAgICAgICAgICAgIC8vIHRoZW4gdHJ5IHRoZSByZXBsYWNlIGFnYWluXHJcbiAgICAgICAgICAgIHByb21pc2UgPSB0aGlzLmxvYWRlci5sb2FkKHN0YXRlLnJvdXRlKS50aGVuKGZ1bmN0aW9uKGh0bWwpIHtcclxuICAgICAgICAgICAgICAgIC8vIEFkZCB0byB0aGUgaXRlbXMgKHRoZSBtYW5hZ2VyIHRha2VzIGNhcmUgeW91XHJcbiAgICAgICAgICAgICAgICAvLyBhZGQgb25seSB0aGUgaXRlbSwgaWYgdGhlcmUgaXMgb25lKVxyXG4gICAgICAgICAgICAgICAgc2hlbGwuaXRlbXMuaW5qZWN0KHN0YXRlLnJvdXRlLm5hbWUsIGh0bWwpO1xyXG4gICAgICAgICAgICAgICAgLy8gRG91YmxlIGNoZWNrIHRoYXQgdGhlIGl0ZW0gd2FzIGFkZGVkIGFuZCBpcyByZWFkeVxyXG4gICAgICAgICAgICAgICAgLy8gdG8gYXZvaWQgYW4gaW5maW5pdGUgbG9vcCBiZWNhdXNlIGEgcmVxdWVzdCBub3QgcmV0dXJuaW5nXHJcbiAgICAgICAgICAgICAgICAvLyB0aGUgaXRlbSBhbmQgdGhlICdyZXBsYWNlJyB0cnlpbmcgdG8gbG9hZCBpdCBhZ2FpbiwgYW5kIGFnYWluLCBhbmQuLlxyXG4gICAgICAgICAgICAgICAgaWYgKHNoZWxsLml0ZW1zLmZpbmQoc3RhdGUucm91dGUubmFtZSkubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzaGVsbC5yZXBsYWNlKHN0YXRlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdQYWdlIG5vdCBmb3VuZCAoJyArIHN0YXRlLnJvdXRlLm5hbWUgKyAnKScpO1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1NoZWxsIFBhZ2Ugbm90IGZvdW5kLCBzdGF0ZTonLCBzdGF0ZSk7XHJcbiAgICAgICAgICAgIHByb21pc2UgPSBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVG8gYXZvaWQgYmVpbmcgaW4gYW4gaW5leGlzdGFudCBVUkwgKGdlbmVyYXRpbmcgaW5jb25zaXN0ZW5jeSBiZXR3ZWVuXHJcbiAgICAgICAgICAgIC8vIGN1cnJlbnQgdmlldyBhbmQgVVJMLCBjcmVhdGluZyBiYWQgaGlzdG9yeSBlbnRyaWVzKSxcclxuICAgICAgICAgICAgLy8gYSBnb0JhY2sgaXMgZXhlY3V0ZWQsIGp1c3QgYWZ0ZXIgdGhlIGN1cnJlbnQgcGlwZSBlbmRzXHJcbiAgICAgICAgICAgIC8vIFRPRE86IGltcGxlbWVudCByZWRpcmVjdCB0aGF0IGN1dCBjdXJyZW50IHByb2Nlc3NpbmcgcmF0aGVyIHRoYW4gZXhlY3V0ZSBkZWxheWVkXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdvQmFjaygpO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcyksIDEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIHRoaXNTaGVsbCA9IHRoaXM7XHJcbiAgICBwcm9taXNlLmNhdGNoKGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgIGlmICghKGVyciBpbnN0YW5jZW9mIEVycm9yKSlcclxuICAgICAgICAgICAgZXJyID0gbmV3IEVycm9yKGVycik7XHJcblxyXG4gICAgICAgIC8vIExvZyBlcnJvciwgXHJcbiAgICAgICAgY29uc29sZS5lcnJvcignU2hlbGwsIHVuZXhwZWN0ZWQgZXJyb3IuJywgZXJyKTtcclxuICAgICAgICAvLyBub3RpZnkgYXMgYW4gZXZlbnRcclxuICAgICAgICB0aGlzU2hlbGwuZW1pdCgnZXJyb3InLCBlcnIpO1xyXG4gICAgICAgIC8vIGFuZCBjb250aW51ZSBwcm9wYWdhdGluZyB0aGUgZXJyb3JcclxuICAgICAgICByZXR1cm4gZXJyO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHByb21pc2U7XHJcbn07XHJcblxyXG5TaGVsbC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gcnVuKCkge1xyXG5cclxuICAgIHZhciBzaGVsbCA9IHRoaXM7XHJcblxyXG4gICAgLy8gQ2F0Y2ggcG9wc3RhdGUgZXZlbnQgdG8gdXBkYXRlIHNoZWxsIHJlcGxhY2luZyB0aGUgYWN0aXZlIGNvbnRhaW5lci5cclxuICAgIC8vIEFsbG93cyBwb2x5ZmlsbHMgdG8gcHJvdmlkZSBhIGRpZmZlcmVudCBidXQgZXF1aXZhbGVudCBldmVudCBuYW1lXHJcbiAgICB0aGlzLiQod2luZG93KS5vbih0aGlzLmhpc3RvcnkucG9wc3RhdGVFdmVudCB8fCAncG9wc3RhdGUnLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBzdGF0ZSA9IGV2ZW50LnN0YXRlIHx8IFxyXG4gICAgICAgICAgICAoZXZlbnQub3JpZ2luYWxFdmVudCAmJiBldmVudC5vcmlnaW5hbEV2ZW50LnN0YXRlKSB8fCBcclxuICAgICAgICAgICAgc2hlbGwuaGlzdG9yeS5zdGF0ZTtcclxuXHJcbiAgICAgICAgLy8gZ2V0IHN0YXRlIGZvciBjdXJyZW50LiBUbyBzdXBwb3J0IHBvbHlmaWxscywgd2UgdXNlIHRoZSBnZW5lcmFsIGdldHRlclxyXG4gICAgICAgIC8vIGhpc3Rvcnkuc3RhdGUgYXMgZmFsbGJhY2sgKHRoZXkgbXVzdCBiZSB0aGUgc2FtZSBvbiBicm93c2VycyBzdXBwb3J0aW5nIEhpc3RvcnkgQVBJKVxyXG4gICAgICAgIHNoZWxsLnJlcGxhY2Uoc3RhdGUpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ2F0Y2ggYWxsIGxpbmtzIGluIHRoZSBwYWdlIChub3Qgb25seSAkcm9vdCBvbmVzKSBhbmQgbGlrZS1saW5rc1xyXG4gICAgdGhpcy4kKGRvY3VtZW50KS5vbih0aGlzLmxpbmtFdmVudCwgJ1tocmVmXSwgW2RhdGEtaHJlZl0nLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyICR0ID0gc2hlbGwuJCh0aGlzKSxcclxuICAgICAgICAgICAgaHJlZiA9ICR0LmF0dHIoJ2hyZWYnKSB8fCAkdC5kYXRhKCdocmVmJyk7XHJcblxyXG4gICAgICAgIC8vIERvIG5vdGhpbmcgaWYgdGhlIFVSTCBjb250YWlucyB0aGUgcHJvdG9jb2xcclxuICAgICAgICBpZiAoL15bYS16XSs6L2kudGVzdChocmVmKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHNoZWxsLmZvcmNlSGFzaGJhbmcgJiYgL14jKFteIV18JCkvLnRlc3QoaHJlZikpIHtcclxuICAgICAgICAgICAgLy8gU3RhbmRhcmQgaGFzaCwgYnV0IG5vdCBoYXNoYmFuZzogYXZvaWQgcm91dGluZyBhbmQgZGVmYXVsdCBiZWhhdmlvclxyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAvLz8gZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgLy8gRXhlY3V0ZWQgZGVsYXllZCB0byBhdm9pZCBoYW5kbGVyIGNvbGxpc2lvbnMsIGJlY2F1c2VcclxuICAgICAgICAvLyBvZiB0aGUgbmV3IHBhZ2UgbW9kaWZ5aW5nIHRoZSBlbGVtZW50IGFuZCBvdGhlciBoYW5kbGVyc1xyXG4gICAgICAgIC8vIHJlYWRpbmcgaXQgYXR0cmlidXRlcyBhbmQgYXBwbHlpbmcgbG9naWMgb24gdGhlIHVwZGF0ZWQgbGlua1xyXG4gICAgICAgIC8vIGFzIGlmIHdhcyB0aGUgb2xkIG9uZSAoZXhhbXBsZTogc2hhcmVkIGxpbmtzLCBsaWtlIGluIGFcclxuICAgICAgICAvLyBnbG9iYWwgbmF2YmFyLCB0aGF0IG1vZGlmaWVzIHdpdGggdGhlIG5ldyBwYWdlKS5cclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBzaGVsbC5nbyhocmVmKTtcclxuICAgICAgICB9LCAxKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEluaXRpYWxsaXplIHN0YXRlXHJcbiAgICB0aGlzLml0ZW1zLmluaXQoKTtcclxuICAgIC8vIFJvdXRlIHRvIHRoZSBjdXJyZW50IHVybC9zdGF0ZVxyXG4gICAgdGhpcy5yZXBsYWNlKCk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgYWJzb2x1dGl6ZVVybCB1dGlsaXR5IFxyXG4gICAgdGhhdCBlbnN1cmVzIHRoZSB1cmwgcHJvdmlkZWRcclxuICAgIGJlaW5nIGluIHRoZSBwYXRoIG9mIHRoZSBnaXZlbiBiYXNlVXJsXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgc2FuaXRpemVVcmwgPSByZXF1aXJlKCcuL3Nhbml0aXplVXJsJyksXHJcbiAgICBlc2NhcGVSZWdFeHAgPSByZXF1aXJlKCcuLi9lc2NhcGVSZWdFeHAnKTtcclxuXHJcbmZ1bmN0aW9uIGFic29sdXRpemVVcmwoYmFzZVVybCwgdXJsKSB7XHJcblxyXG4gICAgLy8gc2FuaXRpemUgYmVmb3JlIGNoZWNrXHJcbiAgICB1cmwgPSBzYW5pdGl6ZVVybCh1cmwpO1xyXG5cclxuICAgIC8vIENoZWNrIGlmIHVzZSB0aGUgYmFzZSBhbHJlYWR5XHJcbiAgICB2YXIgbWF0Y2hCYXNlID0gbmV3IFJlZ0V4cCgnXicgKyBlc2NhcGVSZWdFeHAoYmFzZVVybCksICdpJyk7XHJcbiAgICBpZiAobWF0Y2hCYXNlLnRlc3QodXJsKSkge1xyXG4gICAgICAgIHJldHVybiB1cmw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gYnVpbGQgYW5kIHNhbml0aXplXHJcbiAgICByZXR1cm4gc2FuaXRpemVVcmwoYmFzZVVybCArIHVybCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYWJzb2x1dGl6ZVVybDtcclxuIiwiLyoqXHJcbiAgICBFeHRlcm5hbCBkZXBlbmRlbmNpZXMgZm9yIFNoZWxsIGluIGEgc2VwYXJhdGUgbW9kdWxlXHJcbiAgICB0byB1c2UgYXMgREksIG5lZWRzIHNldHVwIGJlZm9yZSBjYWxsIHRoZSBTaGVsbC5qc1xyXG4gICAgbW9kdWxlIGNsYXNzXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHBhcnNlVXJsOiBudWxsLFxyXG4gICAgYWJzb2x1dGl6ZVVybDogbnVsbCxcclxuICAgIGpxdWVyeTogbnVsbCxcclxuICAgIGxvYWRlcjogbnVsbCxcclxuICAgIGFjY2Vzc0NvbnRyb2w6IGZ1bmN0aW9uIGFsbG93QWxsKC8qbmFtZSovKSB7XHJcbiAgICAgICAgLy8gYWxsb3cgYWNjZXNzIGJ5IGRlZmF1bHRcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH0sXHJcbiAgICBFdmVudEVtaXR0ZXI6IG51bGxcclxufTtcclxuIiwiLyoqXHJcbiAgICBTaW1wbGUgaW1wbGVtZW50YXRpb24gb2YgdGhlIEhpc3RvcnkgQVBJIHVzaW5nIG9ubHkgaGFzaGJhbmdzIFVSTHMsXHJcbiAgICBkb2Vzbid0IG1hdHRlcnMgdGhlIGJyb3dzZXIgc3VwcG9ydC5cclxuICAgIFVzZWQgdG8gYXZvaWQgZnJvbSBzZXR0aW5nIFVSTHMgdGhhdCBoYXMgbm90IGFuIGVuZC1wb2ludCxcclxuICAgIGxpa2UgaW4gbG9jYWwgZW52aXJvbm1lbnRzIHdpdGhvdXQgYSBzZXJ2ZXIgZG9pbmcgdXJsLXJld3JpdGluZyxcclxuICAgIGluIHBob25lZ2FwIGFwcHMsIG9yIHRvIGNvbXBsZXRlbHkgYnktcGFzcyBicm93c2VyIHN1cHBvcnQgYmVjYXVzZVxyXG4gICAgaXMgYnVnZ3kgKGxpa2UgQW5kcm9pZCA8PSA0LjEpLlxyXG4gICAgXHJcbiAgICBOT1RFUzpcclxuICAgIC0gQnJvd3NlciBtdXN0IHN1cHBvcnQgJ2hhc2hjaGFuZ2UnIGV2ZW50LlxyXG4gICAgLSBCcm93c2VyIG11c3QgaGFzIHN1cHBvcnQgZm9yIHN0YW5kYXJkIEpTT04gY2xhc3MuXHJcbiAgICAtIFJlbGllcyBvbiBzZXNzaW9uc3RvcmFnZSBmb3IgcGVyc2lzdGFuY2UsIHN1cHBvcnRlZCBieSBhbGwgYnJvd3NlcnMgYW5kIHdlYnZpZXdzIFxyXG4gICAgICBmb3IgYSBlbm91Z2ggbG9uZyB0aW1lIG5vdy5cclxuICAgIC0gU2ltaWxhciBhcHByb2FjaCBhcyBIaXN0b3J5LmpzIHBvbHlmaWxsLCBidXQgc2ltcGxpZmllZCwgYXBwZW5kaW5nIGEgZmFrZSBxdWVyeVxyXG4gICAgICBwYXJhbWV0ZXIgJ19zdWlkPTAnIHRvIHRoZSBoYXNoIHZhbHVlIChhY3R1YWwgcXVlcnkgZ29lcyBiZWZvcmUgdGhlIGhhc2gsIGJ1dFxyXG4gICAgICB3ZSBuZWVkIGl0IGluc2lkZSkuXHJcbiAgICAtIEZvciBzaW1wbGlmaWNhdGlvbiwgb25seSB0aGUgc3RhdGUgaXMgcGVyc2lzdGVkLCB0aGUgJ3RpdGxlJyBwYXJhbWV0ZXIgaXMgbm90XHJcbiAgICAgIHVzZWQgYXQgYWxsICh0aGUgc2FtZSBhcyBtYWpvciBicm93c2VycyBkbywgc28gaXMgbm90IGEgcHJvYmxlbSk7IGluIHRoaXMgbGluZSxcclxuICAgICAgb25seSBoaXN0b3J5IGVudHJpZXMgd2l0aCBzdGF0ZSBhcmUgcGVyc2lzdGVkLlxyXG4qKi9cclxuLy9nbG9iYWwgbG9jYXRpb25cclxuJ3VzZSBzdHJpY3QnO1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgc2FuaXRpemVVcmwgPSByZXF1aXJlKCcuL3Nhbml0aXplVXJsJyksXHJcbiAgICBnZXRVcmxRdWVyeSA9IHJlcXVpcmUoJy4uL2dldFVybFF1ZXJ5Jyk7XHJcblxyXG4vLyBJbml0OiBMb2FkIHNhdmVkIGNvcHkgZnJvbSBzZXNzaW9uU3RvcmFnZVxyXG52YXIgc2Vzc2lvbiA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oJ2hhc2hiYW5nSGlzdG9yeS5zdG9yZScpO1xyXG4vLyBPciBjcmVhdGUgYSBuZXcgb25lXHJcbmlmICghc2Vzc2lvbikge1xyXG4gICAgc2Vzc2lvbiA9IHtcclxuICAgICAgICAvLyBTdGF0ZXMgYXJyYXkgd2hlcmUgZWFjaCBpbmRleCBpcyB0aGUgU1VJRCBjb2RlIGFuZCB0aGVcclxuICAgICAgICAvLyB2YWx1ZSBpcyBqdXN0IHRoZSB2YWx1ZSBwYXNzZWQgYXMgc3RhdGUgb24gcHVzaFN0YXRlL3JlcGxhY2VTdGF0ZVxyXG4gICAgICAgIHN0YXRlczogW11cclxuICAgIH07XHJcbn1cclxuZWxzZSB7XHJcbiAgICBzZXNzaW9uID0gSlNPTi5wYXJzZShzZXNzaW9uKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gICAgR2V0IHRoZSBTVUlEIG51bWJlclxyXG4gICAgZnJvbSBhIGhhc2ggc3RyaW5nXHJcbioqL1xyXG5mdW5jdGlvbiBnZXRTdWlkKGhhc2gpIHtcclxuICAgIFxyXG4gICAgdmFyIHN1aWQgPSArZ2V0VXJsUXVlcnkoaGFzaCkuX3N1aWQ7XHJcbiAgICBpZiAoaXNOYU4oc3VpZCkpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuIHN1aWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldFN1aWQoaGFzaCwgc3VpZCkge1xyXG4gICAgXHJcbiAgICAvLyBXZSBuZWVkIHRoZSBxdWVyeSwgc2luY2Ugd2UgbmVlZCBcclxuICAgIC8vIHRvIHJlcGxhY2UgdGhlIF9zdWlkIChtYXkgZXhpc3QpXHJcbiAgICAvLyBhbmQgcmVjcmVhdGUgdGhlIHF1ZXJ5IGluIHRoZVxyXG4gICAgLy8gcmV0dXJuZWQgaGFzaC11cmxcclxuICAgIHZhciBxcyA9IGdldFVybFF1ZXJ5KGhhc2gpO1xyXG4gICAgcXMucHVzaCgnX3N1aWQnKTtcclxuICAgIHFzLl9zdWlkID0gc3VpZDtcclxuXHJcbiAgICB2YXIgcXVlcnkgPSBbXTtcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBxcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHF1ZXJ5LnB1c2gocXNbaV0gKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQocXNbcXNbaV1dKSk7XHJcbiAgICB9XHJcbiAgICBxdWVyeSA9IHF1ZXJ5LmpvaW4oJyYnKTtcclxuICAgIFxyXG4gICAgaWYgKHF1ZXJ5KSB7XHJcbiAgICAgICAgdmFyIGluZGV4ID0gaGFzaC5pbmRleE9mKCc/Jyk7XHJcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpXHJcbiAgICAgICAgICAgIGhhc2ggPSBoYXNoLnN1YnN0cigwLCBpbmRleCk7XHJcbiAgICAgICAgaGFzaCArPSAnPycgKyBxdWVyeTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaGFzaDtcclxufVxyXG5cclxuLyoqXHJcbiAgICBBc2sgdG8gcGVyc2lzdCB0aGUgc2Vzc2lvbiBkYXRhLlxyXG4gICAgSXQgaXMgZG9uZSB3aXRoIGEgdGltZW91dCBpbiBvcmRlciB0byBhdm9pZFxyXG4gICAgZGVsYXkgaW4gdGhlIGN1cnJlbnQgdGFzayBtYWlubHkgYW55IGhhbmRsZXJcclxuICAgIHRoYXQgYWN0cyBhZnRlciBhIEhpc3RvcnkgY2hhbmdlLlxyXG4qKi9cclxuZnVuY3Rpb24gcGVyc2lzdCgpIHtcclxuICAgIC8vIEVub3VnaCB0aW1lIHRvIGFsbG93IHJvdXRpbmcgdGFza3MsXHJcbiAgICAvLyBtb3N0IGFuaW1hdGlvbnMgZnJvbSBmaW5pc2ggYW5kIHRoZSBVSVxyXG4gICAgLy8gYmVpbmcgcmVzcG9uc2l2ZS5cclxuICAgIC8vIEJlY2F1c2Ugc2Vzc2lvblN0b3JhZ2UgaXMgc3luY2hyb25vdXMuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oJ2hhc2hiYW5nSGlzdG9yeS5zdG9yZScsIEpTT04uc3RyaW5naWZ5KHNlc3Npb24pKTtcclxuICAgIH0sIDE1MDApO1xyXG59XHJcblxyXG4vKipcclxuICAgIFJldHVybnMgdGhlIGdpdmVuIHN0YXRlIG9yIG51bGxcclxuICAgIGlmIGlzIGFuIGVtcHR5IG9iamVjdC5cclxuKiovXHJcbmZ1bmN0aW9uIGNoZWNrU3RhdGUoc3RhdGUpIHtcclxuICAgIFxyXG4gICAgaWYgKHN0YXRlKSB7XHJcbiAgICAgICAgLy8gaXMgZW1wdHk/XHJcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKHN0YXRlKS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIC8vIE5vXHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gaXRzIGVtcHR5XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICAvLyBBbnl0aGluZyBlbHNlXHJcbiAgICByZXR1cm4gc3RhdGU7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgR2V0IGEgY2Fub25pY2FsIHJlcHJlc2VudGF0aW9uXHJcbiAgICBvZiB0aGUgVVJMIHNvIGNhbiBiZSBjb21wYXJlZFxyXG4gICAgd2l0aCBzdWNjZXNzLlxyXG4qKi9cclxuZnVuY3Rpb24gY2Fubm9uaWNhbFVybCh1cmwpIHtcclxuICAgIFxyXG4gICAgLy8gQXZvaWQgc29tZSBiYWQgb3IgcHJvYmxlbWF0aWMgc3ludGF4XHJcbiAgICB1cmwgPSBzYW5pdGl6ZVVybCh1cmwgfHwgJycpO1xyXG4gICAgXHJcbiAgICAvLyBHZXQgdGhlIGhhc2ggcGFydFxyXG4gICAgdmFyIGloYXNoID0gdXJsLmluZGV4T2YoJyMnKTtcclxuICAgIGlmIChpaGFzaCA+IC0xKSB7XHJcbiAgICAgICAgdXJsID0gdXJsLnN1YnN0cihpaGFzaCArIDEpO1xyXG4gICAgfVxyXG4gICAgLy8gTWF5YmUgYSBoYXNoYmFuZyBVUkwsIHJlbW92ZSB0aGVcclxuICAgIC8vICdiYW5nJyAodGhlIGhhc2ggd2FzIHJlbW92ZWQgYWxyZWFkeSlcclxuICAgIHVybCA9IHVybC5yZXBsYWNlKC9eIS8sICcnKTtcclxuXHJcbiAgICByZXR1cm4gdXJsO1xyXG59XHJcblxyXG4vKipcclxuICAgIFRyYWNrcyB0aGUgbGF0ZXN0IFVSTFxyXG4gICAgYmVpbmcgcHVzaGVkIG9yIHJlcGxhY2VkIGJ5XHJcbiAgICB0aGUgQVBJLlxyXG4gICAgVGhpcyBhbGxvd3MgbGF0ZXIgdG8gYXZvaWRcclxuICAgIHRyaWdnZXIgdGhlIHBvcHN0YXRlIGV2ZW50LFxyXG4gICAgc2luY2UgbXVzdCBOT1QgYmUgdHJpZ2dlcmVkXHJcbiAgICBhcyBhIHJlc3VsdCBvZiB0aGF0IEFQSSBtZXRob2RzXHJcbioqL1xyXG52YXIgbGF0ZXN0UHVzaGVkUmVwbGFjZWRVcmwgPSBudWxsO1xyXG5cclxuLyoqXHJcbiAgICBIaXN0b3J5IFBvbHlmaWxsXHJcbioqL1xyXG52YXIgaGFzaGJhbmdIaXN0b3J5ID0ge1xyXG4gICAgcHVzaFN0YXRlOiBmdW5jdGlvbiBwdXNoU3RhdGUoc3RhdGUsIHRpdGxlLCB1cmwpIHtcclxuXHJcbiAgICAgICAgLy8gY2xlYW51cCB1cmxcclxuICAgICAgICB1cmwgPSBjYW5ub25pY2FsVXJsKHVybCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gc2F2ZSBuZXcgc3RhdGUgZm9yIHVybFxyXG4gICAgICAgIHN0YXRlID0gY2hlY2tTdGF0ZShzdGF0ZSkgfHwgbnVsbDtcclxuICAgICAgICBpZiAoc3RhdGUgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgLy8gc2F2ZSBzdGF0ZVxyXG4gICAgICAgICAgICBzZXNzaW9uLnN0YXRlcy5wdXNoKHN0YXRlKTtcclxuICAgICAgICAgICAgdmFyIHN1aWQgPSBzZXNzaW9uLnN0YXRlcy5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICAvLyB1cGRhdGUgVVJMIHdpdGggdGhlIHN1aWRcclxuICAgICAgICAgICAgdXJsID0gc2V0U3VpZCh1cmwsIHN1aWQpO1xyXG4gICAgICAgICAgICAvLyBjYWxsIHRvIHBlcnNpc3QgdGhlIHVwZGF0ZWQgc2Vzc2lvblxyXG4gICAgICAgICAgICBwZXJzaXN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxhdGVzdFB1c2hlZFJlcGxhY2VkVXJsID0gdXJsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIHVwZGF0ZSBsb2NhdGlvbiB0byB0cmFjayBoaXN0b3J5OlxyXG4gICAgICAgIGxvY2F0aW9uLmhhc2ggPSAnIyEnICsgdXJsO1xyXG4gICAgfSxcclxuICAgIHJlcGxhY2VTdGF0ZTogZnVuY3Rpb24gcmVwbGFjZVN0YXRlKHN0YXRlLCB0aXRsZSwgdXJsKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gY2xlYW51cCB1cmxcclxuICAgICAgICB1cmwgPSBjYW5ub25pY2FsVXJsKHVybCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gaXQgaGFzIHNhdmVkIHN0YXRlP1xyXG4gICAgICAgIHZhciBzdWlkID0gZ2V0U3VpZCh1cmwpLFxyXG4gICAgICAgICAgICBoYXNPbGRTdGF0ZSA9IHN1aWQgIT09IG51bGw7XHJcblxyXG4gICAgICAgIC8vIHNhdmUgbmV3IHN0YXRlIGZvciB1cmxcclxuICAgICAgICBzdGF0ZSA9IGNoZWNrU3RhdGUoc3RhdGUpIHx8IG51bGw7XHJcbiAgICAgICAgLy8gaXRzIHNhdmVkIGlmIHRoZXJlIGlzIHNvbWV0aGluZyB0byBzYXZlXHJcbiAgICAgICAgLy8gb3Igc29tZXRoaW5nIHRvIGRlc3Ryb3lcclxuICAgICAgICBpZiAoc3RhdGUgIT09IG51bGwgfHwgaGFzT2xkU3RhdGUpIHtcclxuICAgICAgICAgICAgLy8gc2F2ZSBzdGF0ZVxyXG4gICAgICAgICAgICBpZiAoaGFzT2xkU3RhdGUpIHtcclxuICAgICAgICAgICAgICAgIC8vIHJlcGxhY2UgZXhpc3Rpbmcgc3RhdGVcclxuICAgICAgICAgICAgICAgIHNlc3Npb24uc3RhdGVzW3N1aWRdID0gc3RhdGU7XHJcbiAgICAgICAgICAgICAgICAvLyB0aGUgdXJsIHJlbWFpbnMgdGhlIHNhbWVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBzdGF0ZVxyXG4gICAgICAgICAgICAgICAgc2Vzc2lvbi5zdGF0ZXMucHVzaChzdGF0ZSk7XHJcbiAgICAgICAgICAgICAgICBzdWlkID0gc2Vzc2lvbi5zdGF0ZXMubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSBVUkwgd2l0aCB0aGUgc3VpZFxyXG4gICAgICAgICAgICAgICAgdXJsID0gc2V0U3VpZCh1cmwsIHN1aWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGNhbGwgdG8gcGVyc2lzdCB0aGUgdXBkYXRlZCBzZXNzaW9uXHJcbiAgICAgICAgICAgIHBlcnNpc3QoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGF0ZXN0UHVzaGVkUmVwbGFjZWRVcmwgPSB1cmw7XHJcblxyXG4gICAgICAgIC8vIHVwZGF0ZSBsb2NhdGlvbiB0byB0cmFjayBoaXN0b3J5OlxyXG4gICAgICAgIGxvY2F0aW9uLmhhc2ggPSAnIyEnICsgdXJsO1xyXG4gICAgfSxcclxuICAgIGdldCBzdGF0ZSgpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgc3VpZCA9IGdldFN1aWQobG9jYXRpb24uaGFzaCk7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgc3VpZCAhPT0gbnVsbCA/XHJcbiAgICAgICAgICAgIHNlc3Npb24uc3RhdGVzW3N1aWRdIDpcclxuICAgICAgICAgICAgbnVsbFxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG4gICAgZ2V0IGxlbmd0aCgpIHtcclxuICAgICAgICByZXR1cm4gd2luZG93Lmhpc3RvcnkubGVuZ3RoO1xyXG4gICAgfSxcclxuICAgIGdvOiBmdW5jdGlvbiBnbyhvZmZzZXQpIHtcclxuICAgICAgICB3aW5kb3cuaGlzdG9yeS5nbyhvZmZzZXQpO1xyXG4gICAgfSxcclxuICAgIGJhY2s6IGZ1bmN0aW9uIGJhY2soKSB7XHJcbiAgICAgICAgd2luZG93Lmhpc3RvcnkuYmFjaygpO1xyXG4gICAgfSxcclxuICAgIGZvcndhcmQ6IGZ1bmN0aW9uIGZvcndhcmQoKSB7XHJcbiAgICAgICAgd2luZG93Lmhpc3RvcnkuZm9yd2FyZCgpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLy8gQXR0YWNoIGhhc2hjYW5nZSBldmVudCB0byB0cmlnZ2VyIEhpc3RvcnkgQVBJIGV2ZW50ICdwb3BzdGF0ZSdcclxudmFyICR3ID0gJCh3aW5kb3cpO1xyXG4kdy5vbignaGFzaGNoYW5nZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgIFxyXG4gICAgdmFyIHVybCA9IGUub3JpZ2luYWxFdmVudC5uZXdVUkw7XHJcbiAgICB1cmwgPSBjYW5ub25pY2FsVXJsKHVybCk7XHJcbiAgICBcclxuICAgIC8vIEFuIFVSTCBiZWluZyBwdXNoZWQgb3IgcmVwbGFjZWRcclxuICAgIC8vIG11c3QgTk9UIHRyaWdnZXIgcG9wc3RhdGVcclxuICAgIGlmICh1cmwgPT09IGxhdGVzdFB1c2hlZFJlcGxhY2VkVXJsKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIFxyXG4gICAgLy8gZ2V0IHN0YXRlIGZyb20gaGlzdG9yeSBlbnRyeVxyXG4gICAgLy8gZm9yIHRoZSB1cGRhdGVkIFVSTCwgaWYgYW55XHJcbiAgICAvLyAoY2FuIGhhdmUgdmFsdWUgd2hlbiB0cmF2ZXJzaW5nXHJcbiAgICAvLyBoaXN0b3J5KS5cclxuICAgIHZhciBzdWlkID0gZ2V0U3VpZCh1cmwpLFxyXG4gICAgICAgIHN0YXRlID0gbnVsbDtcclxuICAgIFxyXG4gICAgaWYgKHN1aWQgIT09IG51bGwpXHJcbiAgICAgICAgc3RhdGUgPSBzZXNzaW9uLnN0YXRlc1tzdWlkXTtcclxuXHJcbiAgICAkdy50cmlnZ2VyKG5ldyAkLkV2ZW50KCdwb3BzdGF0ZScsIHtcclxuICAgICAgICBzdGF0ZTogc3RhdGVcclxuICAgIH0pLCAnaGFzaGJhbmdIaXN0b3J5Jyk7XHJcbn0pO1xyXG5cclxuLy8gRm9yIEhpc3RvcnlBUEkgY2FwYWJsZSBicm93c2Vycywgd2UgbmVlZFxyXG4vLyB0byBjYXB0dXJlIHRoZSBuYXRpdmUgJ3BvcHN0YXRlJyBldmVudCB0aGF0XHJcbi8vIGdldHMgdHJpZ2dlcmVkIG9uIG91ciBwdXNoL3JlcGxhY2VTdGF0ZSBiZWNhdXNlXHJcbi8vIG9mIHRoZSBsb2NhdGlvbiBjaGFuZ2UsIGJ1dCB0b28gb24gdHJhdmVyc2luZ1xyXG4vLyB0aGUgaGlzdG9yeSAoYmFjay9mb3J3YXJkKS5cclxuLy8gV2Ugd2lsbCBsb2NrIHRoZSBldmVudCBleGNlcHQgd2hlbiBpc1xyXG4vLyB0aGUgb25lIHdlIHRyaWdnZXIuXHJcbi8vXHJcbi8vIE5PVEU6IHRvIHRoaXMgdHJpY2sgdG8gd29yaywgdGhpcyBtdXN0XHJcbi8vIGJlIHRoZSBmaXJzdCBoYW5kbGVyIGF0dGFjaGVkIGZvciB0aGlzXHJcbi8vIGV2ZW50LCBzbyBjYW4gYmxvY2sgYWxsIG90aGVycy5cclxuLy8gQUxURVJOQVRJVkU6IGluc3RlYWQgb2YgdGhpcywgb24gdGhlXHJcbi8vIHB1c2gvcmVwbGFjZVN0YXRlIG1ldGhvZHMgZGV0ZWN0IGlmXHJcbi8vIEhpc3RvcnlBUEkgaXMgbmF0aXZlIHN1cHBvcnRlZCBhbmRcclxuLy8gdXNlIHJlcGxhY2VTdGF0ZSB0aGVyZSByYXRoZXIgdGhhblxyXG4vLyBhIGhhc2ggY2hhbmdlLlxyXG4kdy5vbigncG9wc3RhdGUnLCBmdW5jdGlvbihlLCBzb3VyY2UpIHtcclxuICAgIFxyXG4gICAgLy8gRW5zdXJpbmcgaXMgdGhlIG9uZSB3ZSB0cmlnZ2VyXHJcbiAgICBpZiAoc291cmNlID09PSAnaGFzaGJhbmdIaXN0b3J5JylcclxuICAgICAgICByZXR1cm47XHJcbiAgICBcclxuICAgIC8vIEluIG90aGVyIGNhc2UsIGJsb2NrOlxyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxufSk7XHJcblxyXG4vLyBFeHBvc2UgQVBJXHJcbm1vZHVsZS5leHBvcnRzID0gaGFzaGJhbmdIaXN0b3J5O1xyXG4iLCIvKipcclxuICAgIERlZmF1bHQgYnVpbGQgb2YgdGhlIFNoZWxsIGNvbXBvbmVudC5cclxuICAgIEl0IHJldHVybnMgdGhlIFNoZWxsIGNsYXNzIGFzIGEgbW9kdWxlIHByb3BlcnR5LFxyXG4gICAgc2V0dGluZyB1cCB0aGUgYnVpbHQtaW4gbW9kdWxlcyBhcyBpdHMgZGVwZW5kZW5jaWVzLFxyXG4gICAgYW5kIHRoZSBleHRlcm5hbCAnanF1ZXJ5JyBhbmQgJ2V2ZW50cycgKGZvciB0aGUgRXZlbnRFbWl0dGVyKS5cclxuICAgIEl0IHJldHVybnMgdG9vIHRoZSBidWlsdC1pdCBEb21JdGVtc01hbmFnZXIgY2xhc3MgYXMgYSBwcm9wZXJ0eSBmb3IgY29udmVuaWVuY2UuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgZGVwcyA9IHJlcXVpcmUoJy4vZGVwZW5kZW5jaWVzJyksXHJcbiAgICBEb21JdGVtc01hbmFnZXIgPSByZXF1aXJlKCcuL0RvbUl0ZW1zTWFuYWdlcicpLFxyXG4gICAgcGFyc2VVcmwgPSByZXF1aXJlKCcuL3BhcnNlVXJsJyksXHJcbiAgICBhYnNvbHV0aXplVXJsID0gcmVxdWlyZSgnLi9hYnNvbHV0aXplVXJsJyksXHJcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBsb2FkZXIgPSByZXF1aXJlKCcuL2xvYWRlcicpLFxyXG4gICAgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xyXG5cclxuJC5leHRlbmQoZGVwcywge1xyXG4gICAgcGFyc2VVcmw6IHBhcnNlVXJsLFxyXG4gICAgYWJzb2x1dGl6ZVVybDogYWJzb2x1dGl6ZVVybCxcclxuICAgIGpxdWVyeTogJCxcclxuICAgIGxvYWRlcjogbG9hZGVyLFxyXG4gICAgRXZlbnRFbWl0dGVyOiBFdmVudEVtaXR0ZXJcclxufSk7XHJcblxyXG4vLyBEZXBlbmRlbmNpZXMgYXJlIHJlYWR5LCB3ZSBjYW4gbG9hZCB0aGUgY2xhc3M6XHJcbnZhciBTaGVsbCA9IHJlcXVpcmUoJy4vU2hlbGwnKTtcclxuXHJcbmV4cG9ydHMuU2hlbGwgPSBTaGVsbDtcclxuZXhwb3J0cy5Eb21JdGVtc01hbmFnZXIgPSBEb21JdGVtc01hbmFnZXI7XHJcbiIsIi8qKlxyXG4gICAgTG9hZGVyIHV0aWxpdHkgdG8gbG9hZCBTaGVsbCBpdGVtcyBvbiBkZW1hbmQgd2l0aCBBSkFYXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBcclxuICAgIGJhc2VVcmw6ICcvJyxcclxuICAgIFxyXG4gICAgbG9hZDogZnVuY3Rpb24gbG9hZChyb3V0ZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1NoZWxsIGxvYWRpbmcgb24gZGVtYW5kJywgcm91dGUubmFtZSwgcm91dGUpO1xyXG4gICAgICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiBtb2R1bGUuZXhwb3J0cy5iYXNlVXJsICsgcm91dGUubmFtZSArICcuaHRtbCcsXHJcbiAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2VcclxuICAgICAgICAgICAgICAgIC8vIFdlIGFyZSBsb2FkaW5nIHRoZSBwcm9ncmFtIGFuZCBubyBsb2FkZXIgc2NyZWVuIGluIHBsYWNlLFxyXG4gICAgICAgICAgICAgICAgLy8gc28gYW55IGluIGJldHdlZW4gaW50ZXJhY3Rpb24gd2lsbCBiZSBwcm9ibGVtYXRpYy5cclxuICAgICAgICAgICAgICAgIC8vYXN5bmM6IGZhbHNlXHJcbiAgICAgICAgICAgIH0pLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufTtcclxuIiwiLyoqXHJcbiAgICBwYXJzZVVybCBmdW5jdGlvbiBkZXRlY3RpbmdcclxuICAgIHRoZSBtYWluIHBhcnRzIG9mIHRoZSBVUkwgaW4gYVxyXG4gICAgY29udmVuaWVuY2Ugd2F5IGZvciByb3V0aW5nLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGdldFVybFF1ZXJ5ID0gcmVxdWlyZSgnLi4vZ2V0VXJsUXVlcnknKSxcclxuICAgIGVzY2FwZVJlZ0V4cCA9IHJlcXVpcmUoJy4uL2VzY2FwZVJlZ0V4cCcpO1xyXG5cclxuZnVuY3Rpb24gcGFyc2VVcmwoYmFzZVVybCwgbGluaykge1xyXG5cclxuICAgIGxpbmsgPSBsaW5rIHx8ICcnO1xyXG5cclxuICAgIHZhciByYXdVcmwgPSBsaW5rO1xyXG5cclxuICAgIC8vIGhhc2hiYW5nIHN1cHBvcnQ6IHJlbW92ZSB0aGUgIyEgb3Igc2luZ2xlICMgYW5kIHVzZSB0aGUgcmVzdCBhcyB0aGUgbGlua1xyXG4gICAgbGluayA9IGxpbmsucmVwbGFjZSgvXiMhLywgJycpLnJlcGxhY2UoL14jLywgJycpO1xyXG4gICAgXHJcbiAgICAvLyByZW1vdmUgb3B0aW9uYWwgaW5pdGlhbCBzbGFzaCBvciBkb3Qtc2xhc2hcclxuICAgIGxpbmsgPSBsaW5rLnJlcGxhY2UoL15cXC98XlxcLlxcLy8sICcnKTtcclxuXHJcbiAgICAvLyBVUkwgUXVlcnkgYXMgYW4gb2JqZWN0LCBlbXB0eSBvYmplY3QgaWYgbm8gcXVlcnlcclxuICAgIHZhciBxdWVyeSA9IGdldFVybFF1ZXJ5KGxpbmsgfHwgJz8nKTtcclxuXHJcbiAgICAvLyByZW1vdmUgcXVlcnkgZnJvbSB0aGUgcmVzdCBvZiBVUkwgdG8gcGFyc2VcclxuICAgIGxpbmsgPSBsaW5rLnJlcGxhY2UoL1xcPy4qJC8sICcnKTtcclxuXHJcbiAgICAvLyBSZW1vdmUgdGhlIGJhc2VVcmwgdG8gZ2V0IHRoZSBhcHAgYmFzZS5cclxuICAgIHZhciBwYXRoID0gbGluay5yZXBsYWNlKG5ldyBSZWdFeHAoJ14nICsgZXNjYXBlUmVnRXhwKGJhc2VVcmwpLCAnaScpLCAnJyk7XHJcblxyXG4gICAgLy8gR2V0IGZpcnN0IHNlZ21lbnQgb3IgcGFnZSBuYW1lIChhbnl0aGluZyB1bnRpbCBhIHNsYXNoIG9yIGV4dGVuc2lvbiBiZWdnaW5pbmcpXHJcbiAgICB2YXIgbWF0Y2ggPSAvXlxcLz8oW15cXC9cXC5dKylbXlxcL10qKFxcLy4qKSokLy5leGVjKHBhdGgpO1xyXG5cclxuICAgIHZhciBwYXJzZWQgPSB7XHJcbiAgICAgICAgcm9vdDogdHJ1ZSxcclxuICAgICAgICBuYW1lOiBudWxsLFxyXG4gICAgICAgIHNlZ21lbnRzOiBudWxsLFxyXG4gICAgICAgIHBhdGg6IG51bGwsXHJcbiAgICAgICAgdXJsOiByYXdVcmwsXHJcbiAgICAgICAgcXVlcnk6IHF1ZXJ5XHJcbiAgICB9O1xyXG5cclxuICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgIHBhcnNlZC5yb290ID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKG1hdGNoWzFdKSB7XHJcbiAgICAgICAgICAgIHBhcnNlZC5uYW1lID0gbWF0Y2hbMV07XHJcblxyXG4gICAgICAgICAgICBpZiAobWF0Y2hbMl0pIHtcclxuICAgICAgICAgICAgICAgIHBhcnNlZC5wYXRoID0gbWF0Y2hbMl07XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQuc2VnbWVudHMgPSBtYXRjaFsyXS5yZXBsYWNlKC9eXFwvLywgJycpLnNwbGl0KCcvJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQucGF0aCA9ICcvJztcclxuICAgICAgICAgICAgICAgIHBhcnNlZC5zZWdtZW50cyA9IFtdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBwYXJzZWQ7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gcGFyc2VVcmw7IiwiLyoqXHJcbiAgICBzYW5pdGl6ZVVybCB1dGlsaXR5IHRoYXQgZW5zdXJlc1xyXG4gICAgdGhhdCBwcm9ibGVtYXRpYyBwYXJ0cyBnZXQgcmVtb3ZlZC5cclxuICAgIFxyXG4gICAgQXMgZm9yIG5vdyBpdCBkb2VzOlxyXG4gICAgLSByZW1vdmVzIHBhcmVudCBkaXJlY3Rvcnkgc3ludGF4XHJcbiAgICAtIHJlbW92ZXMgZHVwbGljYXRlZCBzbGFzaGVzXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5mdW5jdGlvbiBzYW5pdGl6ZVVybCh1cmwpIHtcclxuICAgIHJldHVybiB1cmwucmVwbGFjZSgvXFwuezIsfS9nLCAnJykucmVwbGFjZSgvXFwvezIsfS9nLCAnLycpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNhbml0aXplVXJsOyIsIi8qKiBcclxuICAgIEFwcE1vZGVsIGV4dGVuc2lvbixcclxuICAgIGZvY3VzZWQgb24gdGhlIEFjY291bnQgcmVsYXRlZCBBUElzOlxyXG4gICAgLSBsb2dpblxyXG4gICAgLSBsb2dvdXRcclxuICAgIC0gc2lnbnVwXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgbG9jYWxmb3JhZ2UgPSByZXF1aXJlKCdsb2NhbGZvcmFnZScpO1xyXG5cclxuZXhwb3J0cy5wbHVnSW4gPSBmdW5jdGlvbiAoQXBwTW9kZWwpIHtcclxuICAgIC8qKlxyXG4gICAgICAgIFRyeSB0byBwZXJmb3JtIGFuIGF1dG9tYXRpYyBsb2dpbiBpZiB0aGVyZSBpcyBhIGxvY2FsXHJcbiAgICAgICAgY29weSBvZiBjcmVkZW50aWFscyB0byB1c2Ugb24gdGhhdCxcclxuICAgICAgICBjYWxsaW5nIHRoZSBsb2dpbiBtZXRob2QgdGhhdCBzYXZlIHRoZSB1cGRhdGVkXHJcbiAgICAgICAgZGF0YSBhbmQgcHJvZmlsZS5cclxuICAgICoqL1xyXG4gICAgQXBwTW9kZWwucHJvdG90eXBlLnRyeUxvZ2luID0gZnVuY3Rpb24gdHJ5TG9naW4oKSB7XHJcbiAgICAgICAgLy8gR2V0IHNhdmVkIGNyZWRlbnRpYWxzXHJcbiAgICAgICAgcmV0dXJuIGxvY2FsZm9yYWdlLmdldEl0ZW0oJ2NyZWRlbnRpYWxzJylcclxuICAgICAgICAudGhlbihmdW5jdGlvbihjcmVkZW50aWFscykge1xyXG4gICAgICAgICAgICAvLyBJZiB3ZSBoYXZlIG9uZXMsIHRyeSB0byBsb2ctaW5cclxuICAgICAgICAgICAgaWYgKGNyZWRlbnRpYWxzKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBBdHRlbXB0IGxvZ2luIHdpdGggdGhhdFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9naW4oXHJcbiAgICAgICAgICAgICAgICAgICAgY3JlZGVudGlhbHMudXNlcm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgY3JlZGVudGlhbHMucGFzc3dvcmRcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHNhdmVkIGNyZWRlbnRpYWxzJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAgICBQZXJmb3JtcyBhIGxvZ2luIGF0dGVtcHQgd2l0aCB0aGUgQVBJIGJ5IHVzaW5nXHJcbiAgICAgICAgdGhlIHByb3ZpZGVkIGNyZWRlbnRpYWxzLlxyXG4gICAgKiovXHJcbiAgICBBcHBNb2RlbC5wcm90b3R5cGUubG9naW4gPSBmdW5jdGlvbiBsb2dpbih1c2VybmFtZSwgcGFzc3dvcmQpIHtcclxuXHJcbiAgICAgICAgLy8gUmVzZXQgdGhlIGV4dHJhIGhlYWRlcnMgdG8gYXR0ZW1wdCB0aGUgbG9naW5cclxuICAgICAgICB0aGlzLnJlc3QuZXh0cmFIZWFkZXJzID0gbnVsbDtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5wb3N0KCdsb2dpbicsIHtcclxuICAgICAgICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxyXG4gICAgICAgICAgICBwYXNzd29yZDogcGFzc3dvcmQsXHJcbiAgICAgICAgICAgIHJldHVyblByb2ZpbGU6IHRydWVcclxuICAgICAgICB9KS50aGVuKHBlcmZvcm1Mb2NhbExvZ2luKHRoaXMsIHVzZXJuYW1lLCBwYXNzd29yZCkpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAgICBQZXJmb3JtcyBhIGxvZ291dCwgcmVtb3ZpbmcgY2FjaGVkIGNyZWRlbnRpYWxzXHJcbiAgICAgICAgYW5kIHByb2ZpbGUgc28gdGhlIGFwcCBjYW4gYmUgZmlsbGVkIHVwIHdpdGhcclxuICAgICAgICBuZXcgdXNlciBpbmZvcm1hdGlvbi5cclxuICAgICAgICBJdCBjYWxscyB0byB0aGUgQVBJIGxvZ291dCBjYWxsIHRvbywgdG8gcmVtb3ZlXHJcbiAgICAgICAgYW55IHNlcnZlci1zaWRlIHNlc3Npb24gYW5kIG5vdGlmaWNhdGlvblxyXG4gICAgICAgIChyZW1vdmVzIHRoZSBjb29raWUgdG9vLCBmb3IgYnJvd3NlciBlbnZpcm9ubWVudFxyXG4gICAgICAgIHRoYXQgbWF5IHVzZSBpdCkuXHJcbiAgICAqKi9cclxuICAgIC8vIEZVVFVSRTogVE9SRVZJRVcgaWYgdGhlIC9sb2dvdXQgY2FsbCBjYW4gYmUgcmVtb3ZlZC5cclxuICAgIC8vIFRPRE86IG11c3QgcmVtb3ZlIGFsbCB0aGUgbG9jYWxseSBzYXZlZC9jYWNoZWQgZGF0YVxyXG4gICAgLy8gcmVsYXRlZCB0byB0aGUgdXNlcj9cclxuICAgIEFwcE1vZGVsLnByb3RvdHlwZS5sb2dvdXQgPSBmdW5jdGlvbiBsb2dvdXQoKSB7XHJcblxyXG4gICAgICAgIC8vIExvY2FsIGFwcCBjbG9zZSBzZXNzaW9uXHJcbiAgICAgICAgdGhpcy5yZXN0LmV4dHJhSGVhZGVycyA9IG51bGw7XHJcbiAgICAgICAgbG9jYWxmb3JhZ2UucmVtb3ZlSXRlbSgnY3JlZGVudGlhbHMnKTtcclxuICAgICAgICBsb2NhbGZvcmFnZS5yZW1vdmVJdGVtKCdwcm9maWxlJyk7XHJcblxyXG4gICAgICAgIC8vIERvbid0IG5lZWQgdG8gd2FpdCB0aGUgcmVzdWx0IG9mIHRoZSBSRVNUIG9wZXJhdGlvblxyXG4gICAgICAgIHRoaXMucmVzdC5wb3N0KCdsb2dvdXQnKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAgICBBdHRlbXB0cyB0byBjcmVhdGUgYSB1c2VyIGFjY291bnQsIGdldHRpbmcgbG9nZ2VkXHJcbiAgICAgICAgaWYgc3VjY2Vzc2Z1bGx5IGxpa2Ugd2hlbiBkb2luZyBhIGxvZ2luIGNhbGwuXHJcbiAgICAqKi9cclxuICAgIEFwcE1vZGVsLnByb3RvdHlwZS5zaWdudXAgPSBmdW5jdGlvbiBzaWdudXAodXNlcm5hbWUsIHBhc3N3b3JkLCBwcm9maWxlVHlwZSkge1xyXG5cclxuICAgICAgICAvLyBSZXNldCB0aGUgZXh0cmEgaGVhZGVycyB0byBhdHRlbXB0IHRoZSBzaWdudXBcclxuICAgICAgICB0aGlzLnJlc3QuZXh0cmFIZWFkcmVzID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gVGhlIHJlc3VsdCBpcyB0aGUgc2FtZSBhcyBpbiBhIGxvZ2luLCBhbmRcclxuICAgICAgICAvLyB3ZSBkbyB0aGUgc2FtZSBhcyB0aGVyZSB0byBnZXQgdGhlIHVzZXIgbG9nZ2VkXHJcbiAgICAgICAgLy8gb24gdGhlIGFwcCBvbiBzaWduLXVwIHN1Y2Nlc3MuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5wb3N0KCdzaWdudXA/dXRtX3NvdXJjZT1hcHAnLCB7XHJcbiAgICAgICAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcclxuICAgICAgICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkLFxyXG4gICAgICAgICAgICBwcm9maWxlVHlwZTogcHJvZmlsZVR5cGUsXHJcbiAgICAgICAgICAgIHJldHVyblByb2ZpbGU6IHRydWVcclxuICAgICAgICB9KS50aGVuKHBlcmZvcm1Mb2NhbExvZ2luKHRoaXMsIHVzZXJuYW1lLCBwYXNzd29yZCkpO1xyXG4gICAgfTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIHBlcmZvcm1Mb2NhbExvZ2luKHRoaXNBcHBNb2RlbCwgdXNlcm5hbWUsIHBhc3N3b3JkKSB7XHJcbiAgICBcclxuICAgIHJldHVybiBmdW5jdGlvbihsb2dnZWQpIHtcclxuICAgICAgICAvLyB1c2UgYXV0aG9yaXphdGlvbiBrZXkgZm9yIGVhY2hcclxuICAgICAgICAvLyBuZXcgUmVzdCByZXF1ZXN0XHJcbiAgICAgICAgdGhpc0FwcE1vZGVsLnJlc3QuZXh0cmFIZWFkZXJzID0ge1xyXG4gICAgICAgICAgICBhbHU6IGxvZ2dlZC51c2VySUQsXHJcbiAgICAgICAgICAgIGFsazogbG9nZ2VkLmF1dGhLZXlcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBhc3luYyBsb2NhbCBzYXZlLCBkb24ndCB3YWl0XHJcbiAgICAgICAgbG9jYWxmb3JhZ2Uuc2V0SXRlbSgnY3JlZGVudGlhbHMnLCB7XHJcbiAgICAgICAgICAgIHVzZXJJRDogbG9nZ2VkLnVzZXJJRCxcclxuICAgICAgICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxyXG4gICAgICAgICAgICBwYXNzd29yZDogcGFzc3dvcmQsXHJcbiAgICAgICAgICAgIGF1dGhLZXk6IGxvZ2dlZC5hdXRoS2V5XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gSU1QT1JUQU5UOiBMb2NhbCBuYW1lIGtlcHQgaW4gc3luYyB3aXRoIHNldC11cCBhdCBBcHBNb2RlbC51c2VyUHJvZmlsZVxyXG4gICAgICAgIGxvY2FsZm9yYWdlLnNldEl0ZW0oJ3Byb2ZpbGUnLCBsb2dnZWQucHJvZmlsZSk7XHJcblxyXG4gICAgICAgIC8vIFNldCB1c2VyIGRhdGFcclxuICAgICAgICB0aGlzQXBwTW9kZWwudXNlcigpLm1vZGVsLnVwZGF0ZVdpdGgobG9nZ2VkLnByb2ZpbGUpO1xyXG5cclxuICAgICAgICByZXR1cm4gbG9nZ2VkO1xyXG4gICAgfTtcclxufVxyXG4iLCIvKiogQXBwTW9kZWwgZXh0ZW5zaW9uLFxyXG4gICAgZm9jdXNlZCBvbiB0aGUgRXZlbnRzIEFQSVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG52YXIgQ2FsZW5kYXJFdmVudCA9IHJlcXVpcmUoJy4uL21vZGVscy9DYWxlbmRhckV2ZW50JyksXHJcbiAgICBhcGlIZWxwZXIgPSByZXF1aXJlKCcuLi91dGlscy9hcGlIZWxwZXInKTtcclxuXHJcbmV4cG9ydHMucGx1Z0luID0gZnVuY3Rpb24gKEFwcE1vZGVsKSB7XHJcbiAgICBcclxuICAgIGFwaUhlbHBlci5kZWZpbmVDcnVkQXBpRm9yUmVzdCh7XHJcbiAgICAgICAgZXh0ZW5kZWRPYmplY3Q6IEFwcE1vZGVsLnByb3RvdHlwZSxcclxuICAgICAgICBNb2RlbDogQ2FsZW5kYXJFdmVudCxcclxuICAgICAgICBtb2RlbE5hbWU6ICdDYWxlbmRhckV2ZW50JyxcclxuICAgICAgICBtb2RlbExpc3ROYW1lOiAnQ2FsZW5kYXJFdmVudHMnLFxyXG4gICAgICAgIG1vZGVsVXJsOiAnZXZlbnRzJyxcclxuICAgICAgICBpZFByb3BlcnR5TmFtZTogJ2NhbGVuZGFyRXZlbnRJRCdcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvKiogIyBBUElcclxuICAgICAgICBBcHBNb2RlbC5wcm90b3R5cGUuZ2V0RXZlbnRzOjpcclxuICAgICAgICBAcGFyYW0ge29iamVjdH0gZmlsdGVyczoge1xyXG4gICAgICAgICAgICBzdGFydDogRGF0ZSxcclxuICAgICAgICAgICAgZW5kOiBEYXRlLFxyXG4gICAgICAgICAgICB0eXBlczogWzMsIDVdIC8vIFtvcHRpb25hbF0gTGlzdCBFdmVudFR5cGVzSURzXHJcbiAgICAgICAgfVxyXG4gICAgICAgIC0tLVxyXG4gICAgICAgIEFwcE1vZGVsLnByb3RvdHlwZS5nZXRFdmVudFxyXG4gICAgICAgIC0tLVxyXG4gICAgICAgIEFwcE1vZGVsLnByb3RvdHlwZS5wdXRFdmVudFxyXG4gICAgICAgIC0tLVxyXG4gICAgICAgIEFwcE1vZGVsLnByb3RvdHlwZS5wb3N0RXZlbnRcclxuICAgICAgICAtLS1cclxuICAgICAgICBBcHBNb2RlbC5wcm90b3R5cGUuZGVsRXZlbnRcclxuICAgICAgICAtLS1cclxuICAgICAgICBBcHBNb2RlbC5wcm90b3R5cGUuc2V0RXZlbnRcclxuICAgICoqL1xyXG59OyIsIi8qKlxyXG4gICAgQXBwb2ludG1lbnRzIGlzIGFuIGFic3RyYWN0aW9uIGFyb3VuZCBjYWxlbmRhciBldmVudHNcclxuICAgIHRoYXQgYmVoYXZlIGFzIGJvb2tpbmdzIG9yIGFzIGV2ZW50cyAod2hlcmUgYm9va2luZ3MgYXJlIGJ1aWx0XHJcbiAgICBvbiB0b3Agb2YgYW4gZXZlbnQgaW5zdGFuY2UgLS1hIGJvb2tpbmcgcmVjb3JkIG11c3QgaGF2ZSBldmVyIGEgY29uZmlybWVkRGF0ZUlEIGV2ZW50KS5cclxuICAgIFxyXG4gICAgV2l0aCB0aGlzIGFwcE1vZGVsLCB0aGUgQVBJcyB0byBtYW5hZ2UgZXZlbnRzJmJvb2tpbmdzIGFyZSBjb21iaW5lZCB0byBvZmZlciByZWxhdGVkXHJcbiAgICByZWNvcmRzIGVhc2llciBpbiBBcHBvaW50bWVudHMgb2JqZWN0cy5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBBcHBvaW50bWVudCA9IHJlcXVpcmUoJy4uL21vZGVscy9BcHBvaW50bWVudCcpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShhcHBNb2RlbCkge1xyXG5cclxuICAgIHZhciBhcGkgPSB7fTtcclxuICAgIFxyXG4gICAgdmFyIGNhY2hlID0ge1xyXG4gICAgICAgIGFwdHNCeURhdGU6IHt9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICAgIEdldCBhIGdlbmVyaWMgY2FsZW5kYXIgYXBwb2ludG1lbnQgb2JqZWN0LCBtYWRlIG9mIGV2ZW50cyBhbmQvb3IgYm9va2luZ3MsXHJcbiAgICAgICAgZGVwZW5kaW5nIG9uIHRoZSBnaXZlbiBJRCBpbiB0aGUgaWRzIG9iamVjdC5cclxuICAgICAgICBcclxuICAgICAgICBUT0RPOiBJbXBsZW1lbnQgY2FjaGUgZm9yIHRoZSBBcHBvaW50bWVudCBNb2RlbHMgKHRoZSBiYWNrLWVuZCBtb2RlbHMgZm9yXHJcbiAgICAgICAgYm9va2luZ3MgYW5kIGV2ZW50cyBpcyBhbHJlYWR5IG1hbmFnZWQgYnkgaXRzIG93biBBUEkpLlxyXG4gICAgKiovXHJcbiAgICBhcGkuZ2V0QXBwb2ludG1lbnQgPSBmdW5jdGlvbiBnZXRBcHBvaW50bWVudChpZHMpIHtcclxuXHJcbiAgICAgICAgaWYgKGlkcy5jYWxlbmRhckV2ZW50SUQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLmNhbGVuZGFyRXZlbnRzLmdldEV2ZW50KGlkcy5jYWxlbmRhckV2ZW50SUQpXHJcbiAgICAgICAgICAgIC50aGVuKEFwcG9pbnRtZW50LmZyb21DYWxlbmRhckV2ZW50KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoaWRzLmJvb2tpbmdJRCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwuYm9va2luZ3MuZ2V0Qm9va2luZyhpZHMuYm9va2luZ0lEKVxyXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihib29raW5nKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBBbiBhcHBvaW50bWVudCBmb3IgYm9va2luZyBuZWVkcyB0aGUgY29uZmlybWVkIGV2ZW50IGluZm9ybWF0aW9uXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwuY2FsZW5kYXJFdmVudHMuZ2V0RXZlbnQoYm9va2luZy5jb25maXJtZWREYXRlSUQoKSlcclxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEFwcG9pbnRtZW50LmZyb21Cb29raW5nKGJvb2tpbmcsIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgnVW5yZWNvZ25pemVkIElEJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgR2V0IGEgbGlzdCBvZiBnZW5lcmljIGNhbGVuZGFyIGFwcG9pbnRtZW50IG9iamVjdHMsIG1hZGUgb2YgZXZlbnRzIGFuZC9vciBib29raW5nc1xyXG4gICAgICAgIGJ5IERhdGUuXHJcbiAgICAgICAgSXQncyBjYWNoZWQuXHJcbiAgICAqKi9cclxuICAgIGFwaS5nZXRBcHBvaW50bWVudHNCeURhdGUgPSBmdW5jdGlvbiBnZXRBcHBvaW50bWVudHNCeURhdGUoZGF0ZSkge1xyXG4gICAgICAgIHZhciBkYXRlS2V5ID0gbW9tZW50KGRhdGUpLmZvcm1hdCgnWVlZWU1NREQnKTtcclxuICAgICAgICBpZiAoY2FjaGUuYXB0c0J5RGF0ZS5oYXNPd25Qcm9wZXJ0eShkYXRlS2V5KSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjYWNoZS5hcHRzQnlEYXRlW2RhdGVLZXldLmRhdGEpO1xyXG5cclxuICAgICAgICAgICAgLy8gVE9ETyBsYXp5IGxvYWQsIG9uIGJhY2tncm91bmQsIGZvciBzeW5jaHJvbml6YXRpb24sIGRlcGVuZGluZyBvbiBjYWNoZSBjb250cm9sXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBUT0RPIGNoZWNrIGxvY2FsZm9yYWdlIGNvcHkgZmlyc3Q/XHJcblxyXG4gICAgICAgICAgICAvLyBSZW1vdGUgbG9hZGluZyBkYXRhXHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbXHJcbiAgICAgICAgICAgICAgICBhcHBNb2RlbC5ib29raW5ncy5nZXRCb29raW5nc0J5RGF0ZShkYXRlKSxcclxuICAgICAgICAgICAgICAgIGFwcE1vZGVsLmNhbGVuZGFyRXZlbnRzLmdldEV2ZW50c0J5RGF0ZShkYXRlKVxyXG4gICAgICAgICAgICBdKS50aGVuKGZ1bmN0aW9uKGdyb3VwKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50cyA9IGdyb3VwWzFdLFxyXG4gICAgICAgICAgICAgICAgICAgIGJvb2tpbmdzID0gZ3JvdXBbMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgYXB0cyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChldmVudHMgJiYgZXZlbnRzKCkubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXB0cyA9IEFwcG9pbnRtZW50Lmxpc3RGcm9tQ2FsZW5kYXJFdmVudHNCb29raW5ncyhldmVudHMoKSwgYm9va2luZ3MoKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIFRPRE8gbG9jYWxmb3JhZ2UgY29weSBvZiBbZGF0ZUtleV09Ym9va2luZ3NcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gUHV0IGluIGNhY2hlXHJcbiAgICAgICAgICAgICAgICBjYWNoZS5hcHRzQnlEYXRlW2RhdGVLZXldID0geyBkYXRhOiBhcHRzIH07XHJcbiAgICAgICAgICAgICAgICAvLyBSZXR1cm4gdGhlIGFycmF5XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXB0cztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgSW50cm9kdWNlIGZyZWUgc2xvdHMgd2hlcmV2ZXIgbmVlZGVkIGluIHRoZSBnaXZlblxyXG4gICAgICAgIGFycmF5IG9mIEFwcG9pbnRtZW50cywgdG8gZmlsbCBhbnkgZ2FwIGluIGEgbmF0dXJhbCBkYXlcclxuICAgICAgICAoZnJvbSBNaWRuaWdodCB0byBNaWRuaWdodCBuZXh0IGRhdGUpLlxyXG4gICAgICAgIEEgbmV3IGFycmF5IGlzIHJldHVybmVkLCBidXQgdGhlIG9yaWdpbmFsIGdldHMgc29ydGVkIFxyXG4gICAgICAgIGJ5IHN0YXJ0VGltZS5cclxuICAgICoqL1xyXG4gICAgYXBpLmZpbGxXaXRoRnJlZVNsb3RzID0gZnVuY3Rpb24gZmlsbFdpdGhGcmVlU2xvdHMoYXBwb2ludG1lbnRzTGlzdCkge1xyXG5cclxuICAgICAgICAvLyBGaXJzdCwgZW5zdXJlIGxpc3QgaXMgc29ydGVkXHJcbiAgICAgICAgdmFyIHNsb3RzID0gYXBwb2ludG1lbnRzTGlzdC5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGEuc3RhcnRUaW1lKCkgPiBiLnN0YXJ0VGltZSgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB2YXIgZmlsbGVkU2xvdHMgPSBbXSxcclxuICAgICAgICAgICAgemVyb1RpbWUgPSAnMDA6MDA6MDAnLFxyXG4gICAgICAgICAgICBsYXN0ID0gemVyb1RpbWUsXHJcbiAgICAgICAgICAgIGxhc3REYXRlVGltZSA9IG51bGwsXHJcbiAgICAgICAgICAgIHRpbWVGb3JtYXQgPSAnSEg6bW06c3MnO1xyXG5cclxuICAgICAgICBzbG90cy5mb3JFYWNoKGZ1bmN0aW9uKHNsb3QpIHtcclxuICAgICAgICAgICAgdmFyIHN0YXJ0ID0gc2xvdC5zdGFydFRpbWUoKSxcclxuICAgICAgICAgICAgICAgIHMgPSBtb21lbnQoc3RhcnQpLFxyXG4gICAgICAgICAgICAgICAgZW5kID0gc2xvdC5lbmRUaW1lKCksXHJcbiAgICAgICAgICAgICAgICBlID0gbW9tZW50KGVuZCk7XHJcblxyXG4gICAgICAgICAgICBpZiAocy5mb3JtYXQodGltZUZvcm1hdCkgPiBsYXN0KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGxhc3REYXRlVGltZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpcnN0IHNsb3Qgb2YgdGhlIGRhdGUsIDEyQU09MDA6MDBcclxuICAgICAgICAgICAgICAgICAgICBsYXN0RGF0ZVRpbWUgPSBuZXcgRGF0ZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQuZ2V0RnVsbFllYXIoKSwgc3RhcnQuZ2V0TW9udGgoKSwgc3RhcnQuZ2V0RGF0ZSgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAwLCAwLCAwXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBUaGVyZSBpcyBhIGdhcCwgZmlsbGVkIGl0XHJcbiAgICAgICAgICAgICAgICBmaWxsZWRTbG90cy5wdXNoKEFwcG9pbnRtZW50Lm5ld0ZyZWVTbG90KHtcclxuICAgICAgICAgICAgICAgICAgICBzdGFydDogbGFzdERhdGVUaW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIGVuZDogc3RhcnRcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZmlsbGVkU2xvdHMucHVzaChzbG90KTtcclxuICAgICAgICAgICAgbGFzdERhdGVUaW1lID0gZW5kO1xyXG4gICAgICAgICAgICBsYXN0ID0gZS5mb3JtYXQodGltZUZvcm1hdCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIENoZWNrIGxhdGVzdCB0byBzZWUgYSBnYXAgYXQgdGhlIGVuZDpcclxuICAgICAgICB2YXIgbGFzdEVuZCA9IGxhc3REYXRlVGltZSAmJiBtb21lbnQobGFzdERhdGVUaW1lKS5mb3JtYXQodGltZUZvcm1hdCk7XHJcbiAgICAgICAgaWYgKGxhc3RFbmQgIT09IHplcm9UaW1lKSB7XHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgZ2FwLCBmaWxsZWQgaXRcclxuICAgICAgICAgICAgdmFyIG5leHRNaWRuaWdodCA9IG5ldyBEYXRlKFxyXG4gICAgICAgICAgICAgICAgbGFzdERhdGVUaW1lLmdldEZ1bGxZZWFyKCksXHJcbiAgICAgICAgICAgICAgICBsYXN0RGF0ZVRpbWUuZ2V0TW9udGgoKSxcclxuICAgICAgICAgICAgICAgIC8vIE5leHQgZGF0ZSFcclxuICAgICAgICAgICAgICAgIGxhc3REYXRlVGltZS5nZXREYXRlKCkgKyAxLFxyXG4gICAgICAgICAgICAgICAgLy8gQXQgemVybyBob3VycyFcclxuICAgICAgICAgICAgICAgIDAsIDAsIDBcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGZpbGxlZFNsb3RzLnB1c2goQXBwb2ludG1lbnQubmV3RnJlZVNsb3Qoe1xyXG4gICAgICAgICAgICAgICAgc3RhcnQ6IGxhc3REYXRlVGltZSxcclxuICAgICAgICAgICAgICAgIGVuZDogbmV4dE1pZG5pZ2h0XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmaWxsZWRTbG90cztcclxuICAgIH07XHJcbiAgICBcclxuICAgIHJldHVybiBhcGk7XHJcbn07XHJcbiIsIi8qKiBCb29raW5nc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEJvb2tpbmcgPSByZXF1aXJlKCcuLi9tb2RlbHMvQm9va2luZycpLFxyXG4vLyAgYXBpSGVscGVyID0gcmVxdWlyZSgnLi4vdXRpbHMvYXBpSGVscGVyJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxuXHJcbmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKGFwcE1vZGVsKSB7XHJcblxyXG4gICAgdmFyIGFwaSA9IHtcclxuICAgICAgICByZW1vdGU6IHtcclxuICAgICAgICAgICAgcmVzdDogYXBwTW9kZWwucmVzdCxcclxuICAgICAgICAgICAgZ2V0Qm9va2luZ3M6IGZ1bmN0aW9uKGZpbHRlcnMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgnYm9va2luZ3MnLCBmaWx0ZXJzKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmF3SXRlbXMpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmF3SXRlbXMgJiYgcmF3SXRlbXMubWFwKGZ1bmN0aW9uKHJhd0l0ZW0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBCb29raW5nKHJhd0l0ZW0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4vKlxyXG4gICAgYXBpSGVscGVyLmRlZmluZUNydWRBcGlGb3JSZXN0KHtcclxuICAgICAgICBleHRlbmRlZE9iamVjdDogYXBpLnJlbW90ZSxcclxuICAgICAgICBNb2RlbDogQm9va2luZyxcclxuICAgICAgICBtb2RlbE5hbWU6ICdCb29raW5nJyxcclxuICAgICAgICBtb2RlbExpc3ROYW1lOiAnQm9va2luZ3MnLFxyXG4gICAgICAgIG1vZGVsVXJsOiAnYm9va2luZ3MnLFxyXG4gICAgICAgIGlkUHJvcGVydHlOYW1lOiAnYm9va2luZ0lEJ1xyXG4gICAgfSk7Ki9cclxuXHJcbiAgICB2YXIgY2FjaGVCeURhdGUgPSB7fTtcclxuXHJcbiAgICBhcGkuZ2V0Qm9va2luZ3NCeURhdGUgPSBmdW5jdGlvbiBnZXRCb29raW5nc0J5RGF0ZShkYXRlKSB7XHJcbiAgICAgICAgdmFyIGRhdGVLZXkgPSBtb21lbnQoZGF0ZSkuZm9ybWF0KCdZWVlZTU1ERCcpO1xyXG4gICAgICAgIGlmIChjYWNoZUJ5RGF0ZS5oYXNPd25Qcm9wZXJ0eShkYXRlS2V5KSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjYWNoZUJ5RGF0ZVtkYXRlS2V5XSk7XHJcblxyXG4gICAgICAgICAgICAvLyBUT0RPIGxhenkgbG9hZCwgb24gYmFja2dyb3VuZCwgZm9yIHN5bmNocm9uaXphdGlvblxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gVE9ETyBjaGVjayBsb2NhbGZvcmFnZSBjb3B5IGZpcnN0XHJcblxyXG4gICAgICAgICAgICAvLyBSZW1vdGUgbG9hZGluZyBkYXRhXHJcbiAgICAgICAgICAgIHJldHVybiBhcGkucmVtb3RlLmdldEJvb2tpbmdzKHtcclxuICAgICAgICAgICAgICAgIHN0YXJ0OiBkYXRlLFxyXG4gICAgICAgICAgICAgICAgZW5kOiBtb21lbnQoZGF0ZSkuYWRkKDEsICdkYXlzJykudG9EYXRlKClcclxuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbihib29raW5ncykge1xyXG4gICAgICAgICAgICAgICAgLy8gVE9ETyBsb2NhbGZvcmFnZSBjb3B5IG9mIFtkYXRlS2V5XT1ib29raW5nc1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFB1dCBpbiBjYWNoZSAodGhleSBhcmUgYWxyZWFkeSBtb2RlbCBpbnN0YW5jZXMpXHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0ga28ub2JzZXJ2YWJsZUFycmF5KGJvb2tpbmdzKTtcclxuICAgICAgICAgICAgICAgIGNhY2hlQnlEYXRlW2RhdGVLZXldID0gYXJyO1xyXG4gICAgICAgICAgICAgICAgLy8gUmV0dXJuIHRoZSBvYnNlcnZhYmxlIGFycmF5XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBHZXQgdXBjb21pbmcgYm9va2luZ3MgbWV0YS1pbmZvcm1hdGlvbiBmb3IgZGFzaGJvYXJkIHBhZ2VcclxuICAgICAgICBUT0RPOiBpbXBsZW1lbnQgY2FjaGU/P1xyXG4gICAgKiovXHJcbiAgICBhcGkuZ2V0VXBjb21pbmdCb29raW5ncyA9IGZ1bmN0aW9uIGdldFVwY29taW5nQm9va2luZ3MoKSB7XHJcbiAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QuZ2V0KCd1cGNvbWluZy1ib29raW5ncycpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAgICBHZXQgYSBzcGVjaWZpYyBib29raW5nIGJ5IElEXHJcbiAgICAgICAgVE9ETzogSW1wbGVtZW50IGNhY2hlPyByZXVzaW5nIGNhY2hlQnlEYXRlP1xyXG4gICAgKiovXHJcbiAgICBhcGkuZ2V0Qm9va2luZyA9IGZ1bmN0aW9uIGdldEJvb2tpbmcoaWQpIHtcclxuICAgICAgICBpZiAoIWlkKSByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ1RoZSBib29raW5nSUQgaXMgcmVxdWlyZWQgdG8gZ2V0IGEgYm9va2luZycpO1xyXG4gICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgnYm9va2luZ3MvJyArIGlkKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGJvb2tpbmcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBCb29raW5nKGJvb2tpbmcpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGFwaTtcclxufTtcclxuIiwiLyoqIEV2ZW50c1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIENhbGVuZGFyRXZlbnQgPSByZXF1aXJlKCcuLi9tb2RlbHMvQ2FsZW5kYXJFdmVudCcpLFxyXG4vLyAgYXBpSGVscGVyID0gcmVxdWlyZSgnLi4vdXRpbHMvYXBpSGVscGVyJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxuXHJcbmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKGFwcE1vZGVsKSB7XHJcblxyXG4gICAgdmFyIGFwaSA9IHtcclxuICAgICAgICByZW1vdGU6IHtcclxuICAgICAgICAgICAgcmVzdDogYXBwTW9kZWwucmVzdCxcclxuICAgICAgICAgICAgZ2V0Q2FsZW5kYXJFdmVudHM6IGZ1bmN0aW9uKGZpbHRlcnMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgnZXZlbnRzJywgZmlsdGVycylcclxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJhd0l0ZW1zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJhd0l0ZW1zICYmIHJhd0l0ZW1zLm1hcChmdW5jdGlvbihyYXdJdGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQ2FsZW5kYXJFdmVudChyYXdJdGVtKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgdmFyIGNhY2hlID0ge1xyXG4gICAgICAgIGV2ZW50c0J5RGF0ZToge31cclxuICAgIH07XHJcblxyXG4gICAgLyphcGlIZWxwZXIuZGVmaW5lQ3J1ZEFwaUZvclJlc3Qoe1xyXG4gICAgICAgIGV4dGVuZGVkT2JqZWN0OiBhcGkucmVtb3RlLFxyXG4gICAgICAgIE1vZGVsOiBDYWxlbmRhckV2ZW50LFxyXG4gICAgICAgIG1vZGVsTmFtZTogJ0NhbGVuZGFyRXZlbnQnLFxyXG4gICAgICAgIG1vZGVsTGlzdE5hbWU6ICdDYWxlbmRhckV2ZW50cycsXHJcbiAgICAgICAgbW9kZWxVcmw6ICdldmVudHMnLFxyXG4gICAgICAgIGlkUHJvcGVydHlOYW1lOiAnY2FsZW5kYXJFdmVudElEJ1xyXG4gICAgfSk7Ki9cclxuXHJcbiAgICBhcGkuZ2V0RXZlbnRzQnlEYXRlID0gZnVuY3Rpb24gZ2V0RXZlbnRzQnlEYXRlKGRhdGUpIHtcclxuICAgICAgICB2YXIgZGF0ZUtleSA9IG1vbWVudChkYXRlKS5mb3JtYXQoJ1lZWVlNTUREJyk7XHJcbiAgICAgICAgaWYgKGNhY2hlLmV2ZW50c0J5RGF0ZS5oYXNPd25Qcm9wZXJ0eShkYXRlS2V5KSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjYWNoZS5ldmVudHNCeURhdGVbZGF0ZUtleV0uZGF0YSk7XHJcblxyXG4gICAgICAgICAgICAvLyBUT0RPIGxhenkgbG9hZCwgb24gYmFja2dyb3VuZCwgZm9yIHN5bmNocm9uaXphdGlvbiwgYmFzZWQgb24gY2FjaGUgY29udHJvbFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gVE9ETyBjaGVjayBsb2NhbGZvcmFnZSBjb3B5IGZpcnN0P1xyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3RlIGxvYWRpbmcgZGF0YVxyXG4gICAgICAgICAgICByZXR1cm4gYXBpLnJlbW90ZS5nZXRDYWxlbmRhckV2ZW50cyh7XHJcbiAgICAgICAgICAgICAgICBzdGFydDogZGF0ZSxcclxuICAgICAgICAgICAgICAgIGVuZDogbW9tZW50KGRhdGUpLmFkZCgxLCAnZGF5cycpLnRvRGF0ZSgpXHJcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24oZXZlbnRzKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPIGxvY2FsZm9yYWdlIGNvcHkgb2YgW2RhdGVLZXldPWJvb2tpbmdzXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUHV0IGluIGNhY2hlICh0aGV5IGFyZSBhbHJlYWR5IG1vZGVsIGluc3RhbmNlcylcclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSBrby5vYnNlcnZhYmxlQXJyYXkoZXZlbnRzKTtcclxuICAgICAgICAgICAgICAgIGNhY2hlLmV2ZW50c0J5RGF0ZVtkYXRlS2V5XSA9IHsgZGF0YTogYXJyIH07XHJcbiAgICAgICAgICAgICAgICAvLyBSZXR1cm4gdGhlIG9ic2VydmFibGUgYXJyYXlcclxuICAgICAgICAgICAgICAgIC8vIFRPRE8gUmV2aWV3IHJlYWxseSBpZiBoYXMgc2Vuc2UgdG8gaGF2ZSBhbiBvYnNlcnZhYmxlIGFycmF5LCB0YWtlIGNhcmUgb2YgaXRzIHVzZSAob24gYXBwb2ludG1lbnRzIG1haW5seSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBhcnI7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEdldCBhIHNwZWNpZmljIGV2ZW50IGJ5IElEXHJcbiAgICAgICAgVE9ETzogSW1wbGVtZW50IGNhY2hlLiBSZXVzaW5nIGNhY2hlQnlEYXRlLCByZS1pbmRleD9cclxuICAgICoqL1xyXG4gICAgYXBpLmdldEV2ZW50ID0gZnVuY3Rpb24gZ2V0RXZlbnQoaWQpIHtcclxuICAgICAgICBpZiAoIWlkKSByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ1RoZSBjYWxlbmRhckV2ZW50SUQgaXMgcmVxdWlyZWQgdG8gZ2V0IGFuIGV2ZW50Jyk7XHJcblxyXG4gICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgnZXZlbnRzLycgKyBpZClcclxuICAgICAgICAudGhlbihmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IENhbGVuZGFyRXZlbnQoZXZlbnQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gYXBpO1xyXG59O1xyXG4iLCIvKiogQ2FsZW5kYXIgU3luY2luZyBhcHAgbW9kZWxcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBDYWxlbmRhclN5bmNpbmcgPSByZXF1aXJlKCcuLi9tb2RlbHMvQ2FsZW5kYXJTeW5jaW5nJyksXHJcbiAgICBSZW1vdGVNb2RlbCA9IHJlcXVpcmUoJy4uL3V0aWxzL1JlbW90ZU1vZGVsJyk7XHJcblxyXG5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShhcHBNb2RlbCkge1xyXG4gICAgdmFyIHJlbSA9IG5ldyBSZW1vdGVNb2RlbCh7XHJcbiAgICAgICAgZGF0YTogbmV3IENhbGVuZGFyU3luY2luZygpLFxyXG4gICAgICAgIHR0bDogeyBtaW51dGVzOiAxIH0sXHJcbiAgICAgICAgbG9jYWxTdG9yYWdlTmFtZTogJ2NhbGVuZGFyU3luY2luZycsXHJcbiAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uIGZldGNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5nZXQoJ2NhbGVuZGFyLXN5bmNpbmcnKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1c2g6IGZ1bmN0aW9uIHB1c2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LnB1dCgnY2FsZW5kYXItc3luY2luZycsIHRoaXMuZGF0YS5tb2RlbC50b1BsYWluT2JqZWN0KCkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBFeHRlbmRpbmcgd2l0aCB0aGUgc3BlY2lhbCBBUEkgbWV0aG9kICdyZXNldEV4cG9ydFVybCdcclxuICAgIHJlbS5pc1Jlc2V0aW5nID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcbiAgICByZW0ucmVzZXRFeHBvcnRVcmwgPSBmdW5jdGlvbiByZXNldEV4cG9ydFVybCgpIHtcclxuICAgICAgICBcclxuICAgICAgICByZW0uaXNSZXNldGluZyh0cnVlKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QucG9zdCgnY2FsZW5kYXItc3luY2luZy9yZXNldC1leHBvcnQtdXJsJylcclxuICAgICAgICAudGhlbihmdW5jdGlvbih1cGRhdGVkU3luY1NldHRpbmdzKSB7XHJcbiAgICAgICAgICAgIC8vIFVwZGF0aW5nIHRoZSBjYWNoZWQgZGF0YVxyXG4gICAgICAgICAgICByZW0uZGF0YS5tb2RlbC51cGRhdGVXaXRoKHVwZGF0ZWRTeW5jU2V0dGluZ3MpO1xyXG4gICAgICAgICAgICByZW0uaXNSZXNldGluZyhmYWxzZSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdXBkYXRlZFN5bmNTZXR0aW5ncztcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHJlbTtcclxufTtcclxuIiwiLyoqIEhvbWUgQWRkcmVzc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEFkZHJlc3MgPSByZXF1aXJlKCcuLi9tb2RlbHMvQWRkcmVzcycpO1xyXG5cclxudmFyIFJlbW90ZU1vZGVsID0gcmVxdWlyZSgnLi4vdXRpbHMvUmVtb3RlTW9kZWwnKTtcclxuXHJcbmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKGFwcE1vZGVsKSB7XHJcbiAgICByZXR1cm4gbmV3IFJlbW90ZU1vZGVsKHtcclxuICAgICAgICBkYXRhOiBuZXcgQWRkcmVzcygpLFxyXG4gICAgICAgIHR0bDogeyBtaW51dGVzOiAxIH0sXHJcbiAgICAgICAgbG9jYWxTdG9yYWdlTmFtZTogJ2hvbWVBZGRyZXNzJyxcclxuICAgICAgICBmZXRjaDogZnVuY3Rpb24gZmV0Y2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgnYWRkcmVzc2VzL2hvbWUnKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1c2g6IGZ1bmN0aW9uIHB1c2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LnB1dCgnYWRkcmVzc2VzL2hvbWUnLCB0aGlzLmRhdGEubW9kZWwudG9QbGFpbk9iamVjdCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqIEZldGNoIEpvYiBUaXRsZXMgYW5kIFByaWNpbmcgVHlwZXMgaW5mb3JtYXRpb25cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBsb2NhbGZvcmFnZSA9IHJlcXVpcmUoJ2xvY2FsZm9yYWdlJyksXHJcbiAgICBQcmljaW5nVHlwZSA9IHJlcXVpcmUoJy4uL21vZGVscy9QcmljaW5nVHlwZScpLFxyXG4gICAgSm9iVGl0bGUgPSByZXF1aXJlKCcuLi9tb2RlbHMvSm9iVGl0bGUnKTtcclxuXHJcbmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKGFwcE1vZGVsKSB7XHJcblxyXG4gICAgdmFyIGFwaSA9IHt9LFxyXG4gICAgICAgIGNhY2hlID0ge1xyXG4gICAgICAgICAgICBqb2JUaXRsZXM6IHt9LFxyXG4gICAgICAgICAgICBwcmljaW5nVHlwZXM6IG51bGxcclxuICAgICAgICB9O1xyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBDb252ZXJ0IHJhdyBhcnJheSBvZiBwcmljaW5nIHR5cGVzIHJlY29yZHMgaW50b1xyXG4gICAgICAgIGFuIGluZGV4ZWQgYXJyYXkgb2YgbW9kZWxzLCBhY3R1YWxseSBhbiBvYmplY3RcclxuICAgICAgICB3aXRoIElEIG51bWJlcnMgYXMgcHJvcGVydGllcyxcclxuICAgICAgICBhbmQgY2FjaGUgaXQgaW4gbWVtb3J5LlxyXG4gICAgKiovXHJcbiAgICBmdW5jdGlvbiBtYXBUb1ByaWNpbmdUeXBlcyhyYXdJdGVtcykge1xyXG4gICAgICAgIGNhY2hlLnByaWNpbmdUeXBlcyA9IHt9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChyYXdJdGVtcykge1xyXG4gICAgICAgICAgICByYXdJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKHJhd0l0ZW0pIHtcclxuICAgICAgICAgICAgICAgIGNhY2hlLnByaWNpbmdUeXBlc1tyYXdJdGVtLnByaWNpbmdUeXBlSURdID0gbmV3IFByaWNpbmdUeXBlKHJhd0l0ZW0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBjYWNoZS5wcmljaW5nVHlwZXM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgICAgUHVibGljIEFQSVxyXG4gICAgICAgIFJldHVybnMgYSBwcm9taXNlIHRvIGZldGNoIHByaWNpbmcgdHlwZXMgaW5mb3JtYXRpb25cclxuICAgICoqL1xyXG4gICAgYXBpLmdldFByaWNpbmdUeXBlcyA9IGZ1bmN0aW9uIGdldFByaWNpbmdUeXBlcygpIHtcclxuICAgICAgICAvLyBGaXJzdCwgaW4tbWVtb3J5IGNhY2hlXHJcbiAgICAgICAgaWYgKGNhY2hlLnByaWNpbmdUeXBlcykge1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNhY2hlLnByaWNpbmdUeXBlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBTZWNvbmQsIGxvY2FsIHN0b3JhZ2VcclxuICAgICAgICAgICAgcmV0dXJuIGxvY2FsZm9yYWdlLmdldEl0ZW0oJ3ByaWNpbmdUeXBlcycpXHJcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHByaWNpbmdUeXBlcykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHByaWNpbmdUeXBlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtYXBUb1ByaWNpbmdUeXBlcyhwcmljaW5nVHlwZXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcmQgYW5kIGxhc3QsIHJlbW90ZSBsb2FkaW5nXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QuZ2V0KCdwcmljaW5nLXR5cGVzJylcclxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocmF3KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhY2hlIGluIGxvY2FsIHN0b3JhZ2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxmb3JhZ2Uuc2V0SXRlbSgncHJpY2luZ1R5cGVzJywgcmF3KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1hcFRvUHJpY2luZ1R5cGVzKHJhdyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgICAgUHVibGljIEFQSVxyXG4gICAgICAgIFJldHVybnMgYSBwcm9taXNlIHRvIGZldGNoIGEgcHJpY2luZyB0eXBlIGJ5IElEXHJcbiAgICAqKi9cclxuICAgIGFwaS5nZXRQcmljaW5nVHlwZSA9IGZ1bmN0aW9uIGdldFByaWNpbmdUeXBlKGlkKSB7XHJcbiAgICAgICAgLy8gVGhlIFJFU1QgQVBJIGFsbG93cyB0byBmZXRjaCBhIHNpbmdsZSBwcmljaW5nIHR5cGUgYnkgSUQsXHJcbiAgICAgICAgLy8gaWYgd2UgaGF2ZSB0aGF0IG5vdCBjYWNoZWQuIEJ1dCBzaW5jZSBsb2FkIGFsbCBpcyBxdWljayAodGhleSBhcmUgYSBmZXdcclxuICAgICAgICAvLyBhbmQgd2lsbCBzdGF5IGJlaW5nIGEgc2hvcnQgbGlzdCksIHdlIGNhbiBhc2sgZm9yIGFsbCBhbmQgZ2V0IGZyb20gdGhhdC5cclxuICAgICAgICAvLyBTbyBpcyBlbm91Z2ggcmV1c2luZyB0aGUgZ2VuZXJhbCAnZ2V0IGFsbCcgQVBJIGFuZCBtb3JlIHNpbXBsZSBjb2RlLlxyXG4gICAgICAgIC8vIE5PVEU6IFRoZSBzaW5nbGUgaXRlbSBBUEkgd2lsbCBzdGlsbCBiZSB1c2VmdWwgZm9yIGZ1dHVyZSBzeW5jIHVwZGF0ZXMuXHJcbiAgICAgICAgcmV0dXJuIGFwaS5nZXRQcmljaW5nVHlwZXMoKS50aGVuKGZ1bmN0aW9uKGFsbEJ5SUQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFsbEJ5SURbaWRdIHx8IG51bGw7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICAgIFB1YmxpYyBBUElcclxuICAgICAgICBHZXQgYSBKb2IgVGl0bGUgaW5mb3JtYXRpb24gYnkgSURcclxuICAgICoqL1xyXG4gICAgYXBpLmdldEpvYlRpdGxlID0gZnVuY3Rpb24gZ2V0Sm9iVGl0bGUoaWQpIHtcclxuICAgICAgICBpZiAoIWlkKSByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ05lZWRzIGFuIElEIHRvIGdldCBhIEpvYiBUaXRsZScpO1xyXG5cclxuICAgICAgICAvLyBGaXJzdCwgaW4tbWVtb3J5IGNhY2hlXHJcbiAgICAgICAgaWYgKGNhY2hlLmpvYlRpdGxlc1tpZF0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjYWNoZS5qb2JUaXRsZXNbaWRdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFNlY29uZCwgbG9jYWwgc3RvcmFnZVxyXG4gICAgICAgICAgICByZXR1cm4gbG9jYWxmb3JhZ2UuZ2V0SXRlbSgnam9iVGl0bGVzLycgKyBpZClcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oam9iVGl0bGUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChqb2JUaXRsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNhY2hlIGluIG1lbW9yeSBhcyBNb2RlbCBpbnN0YW5jZVxyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLmpvYlRpdGxlc1tpZF0gPSBuZXcgSm9iVGl0bGUoam9iVGl0bGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHJldHVybiBpdFxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZS5qb2JUaXRsZXNbaWRdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcmQgYW5kIGxhc3QsIHJlbW90ZSBsb2FkaW5nXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QuZ2V0KCdqb2ItdGl0bGVzLycgKyBpZClcclxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocmF3KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhY2hlIGluIGxvY2FsIHN0b3JhZ2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxmb3JhZ2Uuc2V0SXRlbSgnam9iVGl0bGVzLycgKyBpZCwgcmF3KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2FjaGUgaW4gbWVtb3J5IGFzIE1vZGVsIGluc3RhbmNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLmpvYlRpdGxlc1tpZF0gPSBuZXcgSm9iVGl0bGUocmF3KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmV0dXJuIGl0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZS5qb2JUaXRsZXNbaWRdO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBhcGk7XHJcbn07XHJcbiIsIi8qKiBBcHBNb2RlbCwgY2VudHJhbGl6ZXMgYWxsIHRoZSBkYXRhIGZvciB0aGUgYXBwLFxyXG4gICAgY2FjaGluZyBhbmQgc2hhcmluZyBkYXRhIGFjcm9zcyBhY3Rpdml0aWVzIGFuZCBwZXJmb3JtaW5nXHJcbiAgICByZXF1ZXN0c1xyXG4qKi9cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi4vbW9kZWxzL01vZGVsJyksXHJcbiAgICBSZXN0ID0gcmVxdWlyZSgnLi4vdXRpbHMvUmVzdCcpLFxyXG4gICAgbG9jYWxmb3JhZ2UgPSByZXF1aXJlKCdsb2NhbGZvcmFnZScpO1xyXG5cclxuZnVuY3Rpb24gQXBwTW9kZWwoKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMudXNlclByb2ZpbGUgPSByZXF1aXJlKCcuL0FwcE1vZGVsLnVzZXJQcm9maWxlJykuY3JlYXRlKHRoaXMpO1xyXG4gICAgLy8gTk9URTogQWxpYXMgZm9yIHRoZSB1c2VyIGRhdGFcclxuICAgIC8vIFRPRE86VE9SRVZJRVcgaWYgY29udGludWUgdG8gbWFrZXMgc2Vuc2UgdG8ga2VlcCB0aGlzICd1c2VyKCknIGFsaWFzLCBkb2N1bWVudFxyXG4gICAgLy8gd2hlcmUgaXMgdXNlZCBhbmQgd2h5IGlzIHByZWZlcnJlZCB0byB0aGUgY2Fub25pY2FsIHdheS5cclxuICAgIHRoaXMudXNlciA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnVzZXJQcm9maWxlLmRhdGE7XHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLnNjaGVkdWxpbmdQcmVmZXJlbmNlcyA9IHJlcXVpcmUoJy4vQXBwTW9kZWwuc2NoZWR1bGluZ1ByZWZlcmVuY2VzJykuY3JlYXRlKHRoaXMpO1xyXG4gICAgdGhpcy5jYWxlbmRhclN5bmNpbmcgPSByZXF1aXJlKCcuL0FwcE1vZGVsLmNhbGVuZGFyU3luY2luZycpLmNyZWF0ZSh0aGlzKTtcclxuICAgIHRoaXMuc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlID0gcmVxdWlyZSgnLi9BcHBNb2RlbC5zaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUnKS5jcmVhdGUodGhpcyk7XHJcbiAgICB0aGlzLm1hcmtldHBsYWNlUHJvZmlsZSA9IHJlcXVpcmUoJy4vQXBwTW9kZWwubWFya2V0cGxhY2VQcm9maWxlJykuY3JlYXRlKHRoaXMpO1xyXG4gICAgdGhpcy5ob21lQWRkcmVzcyA9IHJlcXVpcmUoJy4vQXBwTW9kZWwuaG9tZUFkZHJlc3MnKS5jcmVhdGUodGhpcyk7XHJcbiAgICB0aGlzLnByaXZhY3lTZXR0aW5ncyA9IHJlcXVpcmUoJy4vQXBwTW9kZWwucHJpdmFjeVNldHRpbmdzJykuY3JlYXRlKHRoaXMpO1xyXG4gICAgdGhpcy5ib29raW5ncyA9IHJlcXVpcmUoJy4vQXBwTW9kZWwuYm9va2luZ3MnKS5jcmVhdGUodGhpcyk7XHJcbiAgICB0aGlzLmNhbGVuZGFyRXZlbnRzID0gcmVxdWlyZSgnLi9BcHBNb2RlbC5jYWxlbmRhckV2ZW50cycpLmNyZWF0ZSh0aGlzKTtcclxuICAgIHRoaXMuam9iVGl0bGVzID0gcmVxdWlyZSgnLi9BcHBNb2RlbC5qb2JUaXRsZXMnKS5jcmVhdGUodGhpcyk7XHJcbiAgICB0aGlzLnVzZXJKb2JQcm9maWxlID0gcmVxdWlyZSgnLi9BcHBNb2RlbC51c2VySm9iUHJvZmlsZScpLmNyZWF0ZSh0aGlzKTtcclxuICAgIHRoaXMuYXBwb2ludG1lbnRzID0gcmVxdWlyZSgnLi9BcHBNb2RlbC5hcHBvaW50bWVudHMnKS5jcmVhdGUodGhpcyk7XHJcbn1cclxuXHJcbnJlcXVpcmUoJy4vQXBwTW9kZWwtYWNjb3VudCcpLnBsdWdJbihBcHBNb2RlbCk7XHJcblxyXG4vKipcclxuICAgIExvYWQgY3JlZGVudGlhbHMgZnJvbSB0aGUgbG9jYWwgc3RvcmFnZSwgd2l0aG91dCBlcnJvciBpZiB0aGVyZSBpcyBub3RoaW5nXHJcbiAgICBzYXZlZC4gSWYgbG9hZCBwcm9maWxlIGRhdGEgdG9vLCBwZXJmb3JtaW5nIGFuIHRyeUxvZ2luIGlmIG5vIGxvY2FsIGRhdGEuXHJcbioqL1xyXG5BcHBNb2RlbC5wcm90b3R5cGUubG9hZExvY2FsQ3JlZGVudGlhbHMgPSBmdW5jdGlvbiBsb2FkTG9jYWxDcmVkZW50aWFscygpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7IC8vIE5ldmVyIHJlamVjdHM6ICwgcmVqZWN0KSB7XHJcblxyXG4gICAgICAgIC8vIENhbGxiYWNrIHRvIGp1c3QgcmVzb2x2ZSB3aXRob3V0IGVycm9yIChwYXNzaW5nIGluIHRoZSBlcnJvclxyXG4gICAgICAgIC8vIHRvIHRoZSAncmVzb2x2ZScgd2lsbCBtYWtlIHRoZSBwcm9jZXNzIHRvIGZhaWwpLFxyXG4gICAgICAgIC8vIHNpbmNlIHdlIGRvbid0IG5lZWQgdG8gY3JlYXRlIGFuIGVycm9yIGZvciB0aGVcclxuICAgICAgICAvLyBhcHAgaW5pdCwgaWYgdGhlcmUgaXMgbm90IGVub3VnaCBzYXZlZCBpbmZvcm1hdGlvblxyXG4gICAgICAgIC8vIHRoZSBhcHAgaGFzIGNvZGUgdG8gcmVxdWVzdCBhIGxvZ2luLlxyXG4gICAgICAgIHZhciByZXNvbHZlQW55d2F5ID0gZnVuY3Rpb24oZG9lc25NYXR0ZXIpeyAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybmluZygnQXBwIE1vZGVsIEluaXQgZXJyJywgZG9lc25NYXR0ZXIpO1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBJZiB0aGVyZSBhcmUgY3JlZGVudGlhbHMgc2F2ZWRcclxuICAgICAgICBsb2NhbGZvcmFnZS5nZXRJdGVtKCdjcmVkZW50aWFscycpLnRoZW4oZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChjcmVkZW50aWFscyAmJlxyXG4gICAgICAgICAgICAgICAgY3JlZGVudGlhbHMudXNlcklEICYmXHJcbiAgICAgICAgICAgICAgICBjcmVkZW50aWFscy51c2VybmFtZSAmJlxyXG4gICAgICAgICAgICAgICAgY3JlZGVudGlhbHMuYXV0aEtleSkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIHVzZSBhdXRob3JpemF0aW9uIGtleSBmb3IgZWFjaFxyXG4gICAgICAgICAgICAgICAgLy8gbmV3IFJlc3QgcmVxdWVzdFxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXN0LmV4dHJhSGVhZGVycyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBhbHU6IGNyZWRlbnRpYWxzLnVzZXJJRCxcclxuICAgICAgICAgICAgICAgICAgICBhbGs6IGNyZWRlbnRpYWxzLmF1dGhLZXlcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIEl0IGhhcyBjcmVkZW50aWFscyEgSGFzIGJhc2ljIHByb2ZpbGUgZGF0YT9cclxuICAgICAgICAgICAgICAgIC8vIE5PVEU6IHRoZSB1c2VyUHJvZmlsZSB3aWxsIGxvYWQgZnJvbSBsb2NhbCBzdG9yYWdlIG9uIHRoaXMgZmlyc3RcclxuICAgICAgICAgICAgICAgIC8vIGF0dGVtcHQsIGFuZCBsYXppbHkgcmVxdWVzdCB1cGRhdGVkIGRhdGEgZnJvbSByZW1vdGVcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlclByb2ZpbGUubG9hZCgpLnRoZW4oZnVuY3Rpb24ocHJvZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9maWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgcHJvZmlsZSBjYWNoZWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRW5kIHN1Y2Nlc2Z1bGx5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vIHByb2ZpbGUsIHdlIG5lZWQgdG8gcmVxdWVzdCBpdCB0byBiZSBhYmxlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRvIHdvcmsgY29ycmVjdGx5LCBzbyB3ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhdHRlbXB0IGEgbG9naW4gKHRoZSB0cnlMb2dpbiBwcm9jZXNzIHBlcmZvcm1zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGEgbG9naW4gd2l0aCB0aGUgc2F2ZWQgY3JlZGVudGlhbHMgYW5kIGZldGNoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZSBwcm9maWxlIHRvIHNhdmUgaXQgaW4gdGhlIGxvY2FsIGNvcHkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJ5TG9naW4oKS50aGVuKHJlc29sdmUsIHJlc29sdmVBbnl3YXkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSwgcmVzb2x2ZUFueXdheSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBFbmQgc3VjY2Vzc2Z1bGx5LiBOb3QgbG9nZ2luIGlzIG5vdCBhbiBlcnJvcixcclxuICAgICAgICAgICAgICAgIC8vIGlzIGp1c3QgdGhlIGZpcnN0IGFwcCBzdGFydC11cFxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpLCByZXNvbHZlQW55d2F5KTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn07XHJcblxyXG4vKiogSW5pdGlhbGl6ZSBhbmQgd2FpdCBmb3IgYW55dGhpbmcgdXAgKiovXHJcbkFwcE1vZGVsLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gaW5pdCgpIHtcclxuICAgIFxyXG4gICAgLy8gTG9jYWwgZGF0YVxyXG4gICAgLy8gVE9ETyBJbnZlc3RpZ2F0ZSB3aHkgYXV0b21hdGljIHNlbGVjdGlvbiBhbiBJbmRleGVkREIgYXJlXHJcbiAgICAvLyBmYWlsaW5nIGFuZCB3ZSBuZWVkIHRvIHVzZSB0aGUgd29yc2UtcGVyZm9ybWFuY2UgbG9jYWxzdG9yYWdlIGJhY2stZW5kXHJcbiAgICBsb2NhbGZvcmFnZS5jb25maWcoe1xyXG4gICAgICAgIG5hbWU6ICdMb2Nvbm9taWNzQXBwJyxcclxuICAgICAgICB2ZXJzaW9uOiAwLjEsXHJcbiAgICAgICAgc2l6ZSA6IDQ5ODA3MzYsIC8vIFNpemUgb2YgZGF0YWJhc2UsIGluIGJ5dGVzLiBXZWJTUUwtb25seSBmb3Igbm93LlxyXG4gICAgICAgIHN0b3JlTmFtZSA6ICdrZXl2YWx1ZXBhaXJzJyxcclxuICAgICAgICBkZXNjcmlwdGlvbiA6ICdMb2Nvbm9taWNzIEFwcCcsXHJcbiAgICAgICAgZHJpdmVyOiBsb2NhbGZvcmFnZS5MT0NBTFNUT1JBR0VcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBGaXJzdCwgZ2V0IGFueSBzYXZlZCBsb2NhbCBjb25maWdcclxuICAgIC8vIE5PVEU6IGZvciBub3csIHRoaXMgaXMgb3B0aW9uYWwsIHRvIGdldCBhIHNhdmVkIHNpdGVVcmwgcmF0aGVyIHRoYW4gdGhlXHJcbiAgICAvLyBkZWZhdWx0IG9uZSwgaWYgYW55LlxyXG4gICAgcmV0dXJuIGxvY2FsZm9yYWdlLmdldEl0ZW0oJ2NvbmZpZycpXHJcbiAgICAudGhlbihmdW5jdGlvbihjb25maWcpIHtcclxuICAgICAgICAvLyBPcHRpb25hbCBjb25maWdcclxuICAgICAgICBjb25maWcgPSBjb25maWcgfHwge307XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGNvbmZpZy5zaXRlVXJsKSB7XHJcbiAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgaHRtbCBVUkxcclxuICAgICAgICAgICAgJCgnaHRtbCcpLmF0dHIoJ2RhdGEtc2l0ZS11cmwnLCBjb25maWcuc2l0ZVVybCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBjb25maWcuc2l0ZVVybCA9ICQoJ2h0bWwnKS5hdHRyKCdkYXRhLXNpdGUtdXJsJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMucmVzdCA9IG5ldyBSZXN0KGNvbmZpZy5zaXRlVXJsICsgJy9hcGkvdjEvZW4tVVMvJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gU2V0dXAgUmVzdCBhdXRoZW50aWNhdGlvblxyXG4gICAgICAgIHRoaXMucmVzdC5vbkF1dGhvcml6YXRpb25SZXF1aXJlZCA9IGZ1bmN0aW9uKHJldHJ5KSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRyeUxvZ2luKClcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBMb2dnZWQhIEp1c3QgcmV0cnlcclxuICAgICAgICAgICAgICAgIHJldHJ5KCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBJbml0aWFsaXplOiBjaGVjayB0aGUgdXNlciBoYXMgbG9naW4gZGF0YSBhbmQgbmVlZGVkXHJcbiAgICAgICAgLy8gY2FjaGVkIGRhdGEsIHJldHVybiBpdHMgcHJvbWlzZVxyXG4gICAgICAgIHJldHVybiB0aGlzLmxvYWRMb2NhbENyZWRlbnRpYWxzKCk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBcHBNb2RlbDtcclxuXHJcbi8vIENsYXNzIHNwbGl0ZWQgaW4gZGlmZmVyZW50IGZpbGVzIHRvIG1pdGlnYXRlIHNpemUgYW5kIG9yZ2FuaXphdGlvblxyXG4vLyBidXQga2VlcGluZyBhY2Nlc3MgdG8gdGhlIGNvbW1vbiBzZXQgb2YgbWV0aG9kcyBhbmQgb2JqZWN0cyBlYXN5IHdpdGhcclxuLy8gdGhlIHNhbWUgY2xhc3MuXHJcbi8vIExvYWRpbmcgZXh0ZW5zaW9uczpcclxucmVxdWlyZSgnLi9BcHBNb2RlbC1ldmVudHMnKS5wbHVnSW4oQXBwTW9kZWwpO1xyXG5cclxuIiwiLyoqIE1hcmtldHBsYWNlUHJvZmlsZVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIE1hcmtldHBsYWNlUHJvZmlsZSA9IHJlcXVpcmUoJy4uL21vZGVscy9NYXJrZXRwbGFjZVByb2ZpbGUnKTtcclxuXHJcbnZhciBSZW1vdGVNb2RlbCA9IHJlcXVpcmUoJy4uL3V0aWxzL1JlbW90ZU1vZGVsJyk7XHJcblxyXG5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShhcHBNb2RlbCkge1xyXG4gICAgcmV0dXJuIG5ldyBSZW1vdGVNb2RlbCh7XHJcbiAgICAgICAgZGF0YTogbmV3IE1hcmtldHBsYWNlUHJvZmlsZSgpLFxyXG4gICAgICAgIHR0bDogeyBtaW51dGVzOiAxIH0sXHJcbiAgICAgICAgbG9jYWxTdG9yYWdlTmFtZTogJ21hcmtldHBsYWNlUHJvZmlsZScsXHJcbiAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uIGZldGNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5nZXQoJ21hcmtldHBsYWNlLXByb2ZpbGUnKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1c2g6IGZ1bmN0aW9uIHB1c2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LnB1dCgnbWFya2V0cGxhY2UtcHJvZmlsZScsIHRoaXMuZGF0YS5tb2RlbC50b1BsYWluT2JqZWN0KCkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKiogUHJpdmFjeSBTZXR0aW5nc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFByaXZhY3lTZXR0aW5ncyA9IHJlcXVpcmUoJy4uL21vZGVscy9Qcml2YWN5U2V0dGluZ3MnKTtcclxuXHJcbnZhciBSZW1vdGVNb2RlbCA9IHJlcXVpcmUoJy4uL3V0aWxzL1JlbW90ZU1vZGVsJyk7XHJcblxyXG5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShhcHBNb2RlbCkge1xyXG4gICAgcmV0dXJuIG5ldyBSZW1vdGVNb2RlbCh7XHJcbiAgICAgICAgZGF0YTogbmV3IFByaXZhY3lTZXR0aW5ncygpLFxyXG4gICAgICAgIHR0bDogeyBtaW51dGVzOiAxIH0sXHJcbiAgICAgICAgbG9jYWxTdG9yYWdlTmFtZTogJ3ByaXZhY3lTZXR0aW5ncycsXHJcbiAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uIGZldGNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5nZXQoJ3ByaXZhY3ktc2V0dGluZ3MnKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1c2g6IGZ1bmN0aW9uIHB1c2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LnB1dCgncHJpdmFjeS1zZXR0aW5ncycsIHRoaXMuZGF0YS5tb2RlbC50b1BsYWluT2JqZWN0KCkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKipcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBTY2hlZHVsaW5nUHJlZmVyZW5jZXMgPSByZXF1aXJlKCcuLi9tb2RlbHMvU2NoZWR1bGluZ1ByZWZlcmVuY2VzJyk7XHJcblxyXG52YXIgUmVtb3RlTW9kZWwgPSByZXF1aXJlKCcuLi91dGlscy9SZW1vdGVNb2RlbCcpO1xyXG5cclxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoYXBwTW9kZWwpIHtcclxuICAgIHJldHVybiBuZXcgUmVtb3RlTW9kZWwoe1xyXG4gICAgICAgIGRhdGE6IG5ldyBTY2hlZHVsaW5nUHJlZmVyZW5jZXMoKSxcclxuICAgICAgICB0dGw6IHsgbWludXRlczogMSB9LFxyXG4gICAgICAgIGxvY2FsU3RvcmFnZU5hbWU6ICdzY2hlZHVsaW5nUHJlZmVyZW5jZXMnLFxyXG4gICAgICAgIGZldGNoOiBmdW5jdGlvbiBmZXRjaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QuZ2V0KCdzY2hlZHVsaW5nLXByZWZlcmVuY2VzJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXNoOiBmdW5jdGlvbiBwdXNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5wdXQoJ3NjaGVkdWxpbmctcHJlZmVyZW5jZXMnLCB0aGlzLmRhdGEubW9kZWwudG9QbGFpbk9iamVjdCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgU2ltcGxpZmllZFdlZWtseVNjaGVkdWxlID0gcmVxdWlyZSgnLi4vbW9kZWxzL1NpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZScpLFxyXG4gICAgUmVtb3RlTW9kZWwgPSByZXF1aXJlKCcuLi91dGlscy9SZW1vdGVNb2RlbCcpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG4vLyBUaGUgc2xvdCBzaXplIGlzIGZpeGVkIHRvIDE1IG1pbnV0ZXMgYnkgZGVmYXVsdC5cclxuLy8gTk9URTogY3VycmVudGx5LCB0aGUgQVBJIG9ubHkgYWxsb3dzIDE1IG1pbnV0ZXMgc2xvdHMsXHJcbi8vIGJlaW5nIHRoYXQgaW1wbGljaXQsIGJ1dCBwYXJ0IG9mIHRoZSBjb2RlIGlzIHJlYWR5IGZvciBleHBsaWNpdCBzbG90U2l6ZS5cclxudmFyIGRlZmF1bHRTbG90U2l6ZSA9IDE1O1xyXG4vLyBBIGxpc3Qgb2Ygd2VlayBkYXkgcHJvcGVydGllcyBuYW1lcyBhbGxvd2VkXHJcbi8vIHRvIGJlIHBhcnQgb2YgdGhlIG9iamVjdHMgZGVzY3JpYmluZyB3ZWVrbHkgc2NoZWR1bGVcclxuLy8gKHNpbXBsaWZpZWQgb3IgY29tcGxldGUvc2xvdCBiYXNlZClcclxuLy8gSnVzdCBsb3dlY2FzZWQgZW5nbGlzaCBuYW1lc1xyXG52YXIgd2Vla0RheVByb3BlcnRpZXMgPSBbJ3N1bmRheScsICdtb25kYXknLCAndHVlc2RheScsICd3ZWRuZXNkYXknLCAndGh1cnNkYXknLCAnZnJpZGF5JywgJ3NhdHVyZGF5J107XHJcblxyXG5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShhcHBNb2RlbCkge1xyXG4gICAgcmV0dXJuIG5ldyBSZW1vdGVNb2RlbCh7XHJcbiAgICAgICAgZGF0YTogbmV3IFNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSgpLFxyXG4gICAgICAgIHR0bDogeyBtaW51dGVzOiAxIH0sXHJcbiAgICAgICAgbG9jYWxTdG9yYWdlTmFtZTogJ3dlZWtseVNjaGVkdWxlJyxcclxuICAgICAgICBmZXRjaDogZnVuY3Rpb24gZmV0Y2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgnYXZhaWxhYmlsaXR5L3dlZWtseS1zY2hlZHVsZScpXHJcbiAgICAgICAgICAgIC50aGVuKGZyb21XZWVrbHlTY2hlZHVsZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXNoOiBmdW5jdGlvbiBwdXNoKCkge1xyXG4gICAgICAgICAgICB2YXIgcGxhaW5EYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgJ2FsbC10aW1lJzogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAnanNvbi1kYXRhJzoge31cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZGF0YS5pc0FsbFRpbWUoKSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgcGxhaW5EYXRhWydhbGwtdGltZSddID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHBsYWluRGF0YVsnanNvbi1kYXRhJ10gPSBKU09OLnN0cmluZ2lmeSh0b1dlZWtseVNjaGVkdWxlKHRoaXMuZGF0YS5tb2RlbC50b1BsYWluT2JqZWN0KHRydWUpKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LnB1dCgnYXZhaWxhYmlsaXR5L3dlZWtseS1zY2hlZHVsZScsIHBsYWluRGF0YSlcclxuICAgICAgICAgICAgLnRoZW4oZnJvbVdlZWtseVNjaGVkdWxlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGZyb21XZWVrbHlTY2hlZHVsZSh3ZWVrbHlTY2hlZHVsZSkge1xyXG4gICAgXHJcbiAgICAvLyBOZXcgc2ltcGxpZmllZCBvYmplY3QsIGFzIGEgcGxhaW4gb2JqZWN0IHdpdGhcclxuICAgIC8vIHdlZWtkYXlzIHByb3BlcnRpZXMgYW5kIGZyb20tdG8gcHJvcGVydGllcyBsaWtlOlxyXG4gICAgLy8geyBzdW5kYXk6IHsgZnJvbTogMCwgdG86IDYwIH0gfVxyXG4gICAgLy8gU2luY2UgdGhpcyBpcyBleHBlY3RlZCB0byBiZSBjb25zdW1lZCBieSBmZXRjaC1wdXNoXHJcbiAgICAvLyBvcGVyYXRpb25zLCBhbmQgbGF0ZXIgYnkgYW4gJ21vZGVsLnVwZGF0ZVdpdGgnIG9wZXJhdGlvbixcclxuICAgIC8vIHNvIHBsYWluIGlzIHNpbXBsZSBhbmQgYmV0dGVyIG9uIHBlcmZvcm1hbmNlOyBjYW4gYmVcclxuICAgIC8vIGNvbnZlcnRlZCBlYXNpbHkgdG8gdGhlIFNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSBvYmplY3QuXHJcbiAgICB2YXIgc2ltcGxlV1MgPSB7fTtcclxuICAgIFxyXG4gICAgLy8gT25seSBzdXBwb3J0cyAnYXZhaWxhYmxlJyBzdGF0dXMgd2l0aCBkZWZhdWx0ICd1bmF2YWlsYWJsZSdcclxuICAgIGlmICh3ZWVrbHlTY2hlZHVsZS5kZWZhdWx0U3RhdHVzICE9PSAndW5hdmFpbGFibGUnIHx8XHJcbiAgICAgICAgd2Vla2x5U2NoZWR1bGUuc3RhdHVzICE9PSAnYXZhaWxhYmxlJykge1xyXG4gICAgICAgIHRocm93IHtcclxuICAgICAgICAgICAgbmFtZTogJ2lucHV0LWZvcm1hdCcsXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdXZWVrbHkgc2NoZWR1bGUsIGdpdmVuIHN0YXR1c2VzIG5vdCBzdXBwb3J0ZWQsIHN0YXR1czogJyArXHJcbiAgICAgICAgICAgIHdlZWtseVNjaGVkdWxlLnN0YXR1cyArICcsIGRlZmF1bHRTdGF0dXM6ICcgKyBcclxuICAgICAgICAgICAgd2Vla2x5U2NoZWR1bGUuZGVmYXVsdFN0YXR1c1xyXG4gICAgICAgICAgfTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gZ2l2ZW4gc2xvdFNpemUgb3IgZGVmYXVsdFxyXG4gICAgdmFyIHNsb3RTaXplID0gKHdlZWtseVNjaGVkdWxlLnNsb3RTaXplIHx8IGRlZmF1bHRTbG90U2l6ZSkgfDA7XHJcblxyXG4gICAgLy8gUmVhZCBzbG90cyBwZXIgd2Vlay1kYXkgKHsgc2xvdHM6IHsgXCJzdW5kYXlcIjogW10gfSB9KVxyXG4gICAgT2JqZWN0LmtleXMod2Vla2x5U2NoZWR1bGUuc2xvdHMpXHJcbiAgICAuZm9yRWFjaChmdW5jdGlvbih3ZWVrZGF5KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVmVyaWZ5IGlzIGEgd2Vla2RheSBwcm9wZXJ0eSwgb3IgZXhpdCBlYXJseVxyXG4gICAgICAgIGlmICh3ZWVrRGF5UHJvcGVydGllcy5pbmRleE9mKHdlZWtkYXkpID09PSAtMSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBkYXlzbG90cyA9IHdlZWtseVNjaGVkdWxlLnNsb3RzW3dlZWtkYXldO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFdlIGdldCB0aGUgZmlyc3QgYXZhaWxhYmxlIHNsb3QgYW5kIHRoZSBsYXN0IGNvbnNlY3V0aXZlXHJcbiAgICAgICAgLy8gdG8gbWFrZSB0aGUgcmFuZ2VcclxuICAgICAgICB2YXIgZnJvbSA9IG51bGwsXHJcbiAgICAgICAgICAgIHRvID0gbnVsbCxcclxuICAgICAgICAgICAgcHJldmlvdXMgPSBudWxsO1xyXG5cclxuICAgICAgICAvLyB0aW1lcyBhcmUgb3JkZXJlZCBpbiBhc2NlbmRpbmdcclxuICAgICAgICAvLyBhbmQgd2l0aCBmb3JtYXQgXCIwMDowMDowMFwiIHRoYXQgd2UgY29udmVydCB0byBtaW51dGVzXHJcbiAgICAgICAgLy8gKGVub3VnaCBwcmVjaXNpb24gZm9yIHNpbXBsaWZpZWQgd2Vla2x5IHNjaGVkdWxlKVxyXG4gICAgICAgIC8vIHVzaW5nIG1vbWVudC5kdXJhdGlvblxyXG4gICAgICAgIC8vIE5PVEU6IHVzaW5nICdzb21lJyByYXRoZXIgdGhhbiAnZm9yRWFjaCcgdG8gYmUgYWJsZVxyXG4gICAgICAgIC8vIHRvIGV4aXQgZWFybHkgZnJvbSB0aGUgaXRlcmF0aW9uIGJ5IHJldHVybmluZyAndHJ1ZSdcclxuICAgICAgICAvLyB3aGVuIHRoZSBlbmQgaXMgcmVhY2hlZC5cclxuICAgICAgICBkYXlzbG90cy5zb21lKGZ1bmN0aW9uKHNsb3QpIHtcclxuICAgICAgICAgICAgdmFyIG1pbnV0ZXMgPSBtb21lbnQuZHVyYXRpb24oc2xvdCkuYXNNaW51dGVzKCkgfDA7XHJcbiAgICAgICAgICAgIC8vIFdlIGhhdmUgbm90IHN0aWxsIGEgJ2Zyb20nIHRpbWU6XHJcbiAgICAgICAgICAgIGlmIChmcm9tID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBmcm9tID0gbWludXRlcztcclxuICAgICAgICAgICAgICAgIHByZXZpb3VzID0gbWludXRlcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIFdlIGhhdmUgYSBiZWdnaW5pbmcsIGNoZWNrIGlmIHRoaXMgaXMgY29uc2VjdXRpdmVcclxuICAgICAgICAgICAgICAgIC8vIHRvIHByZXZpb3VzLCBieSBjaGVja2luZyBwcmV2aW91cyBwbHVzIHNsb3RTaXplXHJcbiAgICAgICAgICAgICAgICBpZiAocHJldmlvdXMgKyBzbG90U2l6ZSA9PT0gbWludXRlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIE5ldyBlbmRcclxuICAgICAgICAgICAgICAgICAgICB0byA9IG1pbnV0ZXM7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTmV4dCBpdGVyYXRpb25cclxuICAgICAgICAgICAgICAgICAgICBwcmV2aW91cyA9IG1pbnV0ZXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBObyBjb25zZWN1dGl2ZSwgd2UgYWxyZWFkeSBoYXMgYSByYW5nZSwgYW55XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYWRkaXRpb25hbCBzbG90IGlzIGRpc2NhcmRlZCwgb3V0IG9mIHRoZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHByZWNpc2lvbiBvZiB0aGUgc2ltcGxpZmllZCB3ZWVrbHkgc2NoZWR1bGUsXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gc28gd2UgY2FuIGdvIG91dCB0aGUgaXRlcmF0aW9uOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIE5PVEU6IElmIGluIGEgZnV0dXJlIGEgbW9yZSBjb21wbGV0ZSBzY2hlZHVsZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIG5lZWQgdG8gYmUgd3JvdGVuIHVzaW5nIG11bHRpcGxlIHJhbmdlcyByYXRoZXJcclxuICAgICAgICAgICAgICAgICAgICAvLyBpbmRpdmlkdWFsIHNsb3RzLCB0aGlzIGlzIHRoZSBwbGFjZSB0byBjb250aW51ZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvZGluZywgcG9wdWxhdGluZyBhbiBhcnJheSBvZiBbe2Zyb20sIHRvfV0gOi0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBTbG90cyBjaGVja2VkLCBjaGVjayB0aGUgcmVzdWx0XHJcbiAgICAgICAgaWYgKGZyb20gIT09IG51bGwpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBzaW1wbGVEYXkgPSB7XHJcbiAgICAgICAgICAgICAgICBmcm9tOiBmcm9tLFxyXG4gICAgICAgICAgICAgICAgdG86IDBcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgc2ltcGxlV1Nbd2Vla2RheV0gPSBzaW1wbGVEYXk7XHJcblxyXG4gICAgICAgICAgICAvLyBXZSBoYXZlIGEgcmFuZ2UhXHJcbiAgICAgICAgICAgIGlmICh0byAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgLy8gYW5kIGhhcyBhbiBlbmQhXHJcbiAgICAgICAgICAgICAgICAvLyBhZGQgdGhlIHNsb3Qgc2l6ZSB0byB0aGUgZW5kaW5nXHJcbiAgICAgICAgICAgICAgICBzaW1wbGVEYXkudG8gPSB0byArIHNsb3RTaXplO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gc21hbGxlciByYW5nZSwganVzdCBvbmUgc2xvdCxcclxuICAgICAgICAgICAgICAgIC8vIGFkZCB0aGUgc2xvdCBzaXplIHRvIHRoZSBiZWdpbmluZ1xyXG4gICAgICAgICAgICAgICAgc2ltcGxlRGF5LnRvID0gZnJvbSArIHNsb3RTaXplO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gRG9uZSFcclxuICAgIHJldHVybiBzaW1wbGVXUztcclxufVxyXG5cclxuLyoqXHJcbiAgICBQYXNzIGluIGEgcGxhaW4gb2JqZWN0LCBub3QgYSBtb2RlbCxcclxuICAgIGdldHRpbmcgYW4gb2JqZWN0IHN1aXRhYmxlIGZvciB0aGUgQVBJIGVuZHBvaW50LlxyXG4qKi9cclxuZnVuY3Rpb24gdG9XZWVrbHlTY2hlZHVsZShzaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUpIHtcclxuXHJcbiAgICB2YXIgc2xvdFNpemUgPSBkZWZhdWx0U2xvdFNpemU7XHJcbiAgICBcclxuICAgIC8vIEl0J3MgYnVpbGQgd2l0aCAnYXZhaWxhYmxlJyBhcyBleHBsaWNpdCBzdGF0dXM6XHJcbiAgICB2YXIgd2Vla2x5U2NoZWR1bGUgPSB7XHJcbiAgICAgICAgc3RhdHVzOiAnYXZhaWxhYmxlJyxcclxuICAgICAgICBkZWZhdWx0QXZhaWxhYmlsaXR5OiAndW5hdmFpbGFibGUnLFxyXG4gICAgICAgIHNsb3RzOiB7fSxcclxuICAgICAgICBzbG90U2l6ZTogc2xvdFNpemVcclxuICAgIH07XHJcblxyXG4gICAgLy8gUGVyIHdlZWtkYXlcclxuICAgIE9iamVjdC5rZXlzKHNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSlcclxuICAgIC5mb3JFYWNoKGZ1bmN0aW9uKHdlZWtkYXkpIHtcclxuXHJcbiAgICAgICAgLy8gVmVyaWZ5IGlzIGEgd2Vla2RheSBwcm9wZXJ0eSwgb3IgZXhpdCBlYXJseVxyXG4gICAgICAgIGlmICh3ZWVrRGF5UHJvcGVydGllcy5pbmRleE9mKHdlZWtkYXkpID09PSAtMSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgc2ltcGxlRGF5ID0gc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlW3dlZWtkYXldO1xyXG5cclxuICAgICAgICAvLyBXZSBuZWVkIHRvIGV4cGFuZCB0aGUgc2ltcGxpZmllZCB0aW1lIHJhbmdlcyBcclxuICAgICAgICAvLyBpbiBzbG90cyBvZiB0aGUgc2xvdFNpemVcclxuICAgICAgICAvLyBUaGUgZW5kIHRpbWUgd2lsbCBiZSBleGNsdWRlZCwgc2luY2Ugc2xvdHNcclxuICAgICAgICAvLyBkZWZpbmUgb25seSB0aGUgc3RhcnQsIGJlaW5nIGltcGxpY2l0IHRoZSBzbG90U2l6ZS5cclxuICAgICAgICB2YXIgZnJvbSA9IHNpbXBsZURheS5mcm9tIHwwLFxyXG4gICAgICAgICAgICB0byA9IHNpbXBsZURheS50byB8MDtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBzbG90IGFycmF5XHJcbiAgICAgICAgd2Vla2x5U2NoZWR1bGUuc2xvdHNbd2Vla2RheV0gPSBbXTtcclxuXHJcbiAgICAgICAgLy8gSW50ZWdyaXR5IHZlcmlmaWNhdGlvblxyXG4gICAgICAgIGlmICh0byA+IGZyb20pIHtcclxuICAgICAgICAgICAgLy8gSXRlcmF0ZSBieSB0aGUgc2xvdFNpemUgdW50aWwgd2UgcmVhY2hcclxuICAgICAgICAgICAgLy8gdGhlIGVuZCwgbm90IGluY2x1ZGluZyB0aGUgJ3RvJyBzaW5jZVxyXG4gICAgICAgICAgICAvLyBzbG90cyBpbmRpY2F0ZSBvbmx5IHRoZSBzdGFydCBvZiB0aGUgc2xvdFxyXG4gICAgICAgICAgICAvLyB0aGF0IGlzIGFzc3VtZWQgdG8gZmlsbCBhIHNsb3RTaXplIHN0YXJ0aW5nXHJcbiAgICAgICAgICAgIC8vIG9uIHRoYXQgc2xvdC10aW1lXHJcbiAgICAgICAgICAgIHZhciBwcmV2aW91cyA9IGZyb207XHJcbiAgICAgICAgICAgIHdoaWxlIChwcmV2aW91cyA8IHRvKSB7XHJcbiAgICAgICAgICAgICAgICB3ZWVrbHlTY2hlZHVsZS5zbG90c1t3ZWVrZGF5XS5wdXNoKG1pbnV0ZXNUb1RpbWVTdHJpbmcocHJldmlvdXMpKTtcclxuICAgICAgICAgICAgICAgIHByZXZpb3VzICs9IHNsb3RTaXplO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gRG9uZSFcclxuICAgIHJldHVybiB3ZWVrbHlTY2hlZHVsZTtcclxufVxyXG5cclxuLyoqXHJcbiAgICBpbnRlcm5hbCB1dGlsaXR5IGZ1bmN0aW9uICd0byBzdHJpbmcgd2l0aCB0d28gZGlnaXRzIGFsbW9zdCdcclxuKiovXHJcbmZ1bmN0aW9uIHR3b0RpZ2l0cyhuKSB7XHJcbiAgICByZXR1cm4gTWF0aC5mbG9vcihuIC8gMTApICsgJycgKyBuICUgMTA7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgQ29udmVydCBhIG51bWJlciBvZiBtaW51dGVzXHJcbiAgICBpbiBhIHN0cmluZyBsaWtlOiAwMDowMDowMCAoaG91cnM6bWludXRlczpzZWNvbmRzKVxyXG4qKi9cclxuZnVuY3Rpb24gbWludXRlc1RvVGltZVN0cmluZyhtaW51dGVzKSB7XHJcbiAgICB2YXIgZCA9IG1vbWVudC5kdXJhdGlvbihtaW51dGVzLCAnbWludXRlcycpLFxyXG4gICAgICAgIGggPSBkLmhvdXJzKCksXHJcbiAgICAgICAgbSA9IGQubWludXRlcygpLFxyXG4gICAgICAgIHMgPSBkLnNlY29uZHMoKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIChcclxuICAgICAgICB0d29EaWdpdHMoaCkgKyAnOicgK1xyXG4gICAgICAgIHR3b0RpZ2l0cyhtKSArICc6JyArXHJcbiAgICAgICAgdHdvRGlnaXRzKHMpXHJcbiAgICApO1xyXG59XHJcbiIsIi8qKlxyXG4gICAgTW9kZWwgQVBJIHRvIG1hbmFnZSB0aGUgY29sbGVjdGlvbiBvZiBKb2IgVGl0bGVzIGFzc2lnbmVkXHJcbiAgICB0byB0aGUgY3VycmVudCB1c2VyIGFuZCBpdHMgd29ya2luZyBkYXRhLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFVzZXJKb2JUaXRsZSA9IHJlcXVpcmUoJy4uL21vZGVscy9Vc2VySm9iVGl0bGUnKSxcclxuICAgIENhY2hlQ29udHJvbCA9IHJlcXVpcmUoJy4uL3V0aWxzL0NhY2hlQ29udHJvbCcpLFxyXG4gICAgbG9jYWxmb3JhZ2UgPSByZXF1aXJlKCdsb2NhbGZvcmFnZScpO1xyXG5cclxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoYXBwTW9kZWwpIHtcclxuXHJcbiAgICB2YXIgYXBpID0ge30sXHJcbiAgICAgICAgZGVmYXVsdFR0bCA9IHsgbWludXRlczogMSB9LFxyXG4gICAgICAgIGNhY2hlID0ge1xyXG4gICAgICAgICAgICAvLyBBcnJheSBvZiB1c2VyIGpvYiB0aXRsZXMgbWFraW5nXHJcbiAgICAgICAgICAgIC8vIGl0cyBwcm9maWxlXHJcbiAgICAgICAgICAgIHVzZXJKb2JQcm9maWxlOiB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZTogbmV3IENhY2hlQ29udHJvbCh7IHR0bDogZGVmYXVsdFR0bCB9KSxcclxuICAgICAgICAgICAgICAgIGxpc3Q6IG51bGxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8gSW5kZXhlZCBsaXN0IGJ5IGpvYlRpdGxlSUQgdG8gdGhlIHVzZXIgam9iIHRpdGxlcyBtb2RlbHNcclxuICAgICAgICAgICAgLy8gaW4gdGhlIGxpc3QgYW5kIGNhY2hlIGluZm9ybWF0aW9uXHJcbiAgICAgICAgICAgIHVzZXJKb2JUaXRsZXM6IHt9XHJcbiAgICAgICAgfTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgQ29udmVydCByYXcgYXJyYXkgb2YgcHJpY2luZyB0eXBlcyByZWNvcmRzIGludG9cclxuICAgICAgICBhbiBpbmRleGVkIGFycmF5IG9mIG1vZGVscywgYWN0dWFsbHkgYW4gb2JqZWN0XHJcbiAgICAgICAgd2l0aCBJRCBudW1iZXJzIGFzIHByb3BlcnRpZXMsXHJcbiAgICAgICAgYW5kIGNhY2hlIGl0IGluIG1lbW9yeS5cclxuICAgICoqL1xyXG4gICAgZnVuY3Rpb24gbWFwVG9Vc2VySm9iUHJvZmlsZShyYXdJdGVtcykge1xyXG4gICAgICAgIGNhY2hlLnVzZXJKb2JQcm9maWxlLmxpc3QgPSBbXTtcclxuICAgICAgICBjYWNoZS51c2VySm9iVGl0bGVzID0ge307XHJcblxyXG4gICAgICAgIGlmIChyYXdJdGVtcykge1xyXG4gICAgICAgICAgICByYXdJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKHJhd0l0ZW0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBtID0gbmV3IFVzZXJKb2JUaXRsZShyYXdJdGVtKTtcclxuICAgICAgICAgICAgICAgIGNhY2hlLnVzZXJKb2JQcm9maWxlLmxpc3QucHVzaChtKTtcclxuICAgICAgICAgICAgICAgIC8vIFNhdmluZyBhbmQgaW5kZXhlZCBjb3B5IGFuZCBwZXIgaXRlbSBjYWNoZSBpbmZvXHJcbiAgICAgICAgICAgICAgICBzZXRHZXRVc2VySm9iVGl0bGVUb0NhY2hlKHJhd0l0ZW0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFVwZGF0ZSBjYWNoZSBzdGF0ZVxyXG4gICAgICAgIGNhY2hlLnVzZXJKb2JQcm9maWxlLmNhY2hlLmxhdGVzdCA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLnVzZXJKb2JQcm9maWxlLmxpc3Q7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEdldCB0aGUgZnVsbCBqb2JQcm9maWxlIGZyb20gbG9jYWwgY29weSwgdGhyb3dpbmcgYSBQcm9taXNlIHJlamVjdCBleGNlcHRpb24gaWYgbm90aGluZ1xyXG4gICAgKiovXHJcbiAgICBmdW5jdGlvbiBnZXRVc2VySm9iUHJvZmlsZUZyb21Mb2NhbCgpIHtcclxuICAgICAgICByZXR1cm4gbG9jYWxmb3JhZ2UuZ2V0SXRlbSgndXNlckpvYlByb2ZpbGUnKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHVzZXJKb2JQcm9maWxlKSB7XHJcbiAgICAgICAgICAgIGlmICh1c2VySm9iUHJvZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcFRvVXNlckpvYlByb2ZpbGUodXNlckpvYlByb2ZpbGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFRocm93IGVycm9yLCBzbyB1c2UgY2F0Y2ggdG8gZGV0ZWN0IGl0XHJcbiAgICAgICAgICAgIHRocm93IHsgbmFtZTogJ05vdEZvdW5kTG9jYWwnLCBtZXNzYWdlOiAnTm90IGZvdW5kIG9uIGxvY2FsIHN0b3JhZ2UnIH07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIFNldCBhIHJhdyB1c2VySm9iUHJvZmlsZSByZWNvcmQgKGZyb20gc2VydmVyKSBhbmQgc2V0IGl0IGluIHRoZVxyXG4gICAgICAgIGNhY2hlLCBjcmVhdGluZyBvciB1cGRhdGluZyB0aGUgbW9kZWwgKHNvIGFsbCB0aGUgdGltZSB0aGUgc2FtZSBtb2RlbCBpbnN0YW5jZVxyXG4gICAgICAgIGlzIHVzZWQpIGFuZCBjYWNoZSBjb250cm9sIGluZm9ybWF0aW9uLlxyXG4gICAgICAgIFJldHVybnMgdGhlIG1vZGVsIGluc3RhbmNlLlxyXG4gICAgKiovXHJcbiAgICBmdW5jdGlvbiBzZXRHZXRVc2VySm9iVGl0bGVUb0NhY2hlKHJhd0l0ZW0pIHtcclxuICAgICAgICB2YXIgYyA9IGNhY2hlLnVzZXJKb2JUaXRsZXNbcmF3SXRlbS5qb2JUaXRsZUlEXSB8fCB7fTtcclxuICAgICAgICAvLyBVcGRhdGUgdGhlIG1vZGVsIGlmIGV4aXN0cywgc28gZ2V0IHJlZmxlY3RlZCB0byBhbnlvbmUgY29uc3VtaW5nIGl0XHJcbiAgICAgICAgaWYgKGMubW9kZWwpIHtcclxuICAgICAgICAgICAgYy5tb2RlbC5tb2RlbC51cGRhdGVXaXRoKHJhd0l0ZW0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gRmlyc3QgdGltZSwgY3JlYXRlIG1vZGVsXHJcbiAgICAgICAgICAgIGMubW9kZWwgPSBuZXcgVXNlckpvYlRpdGxlKHJhd0l0ZW0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBVcGRhdGUgY2FjaGUgY29udHJvbFxyXG4gICAgICAgIGlmIChjLmNhY2hlKSB7XHJcbiAgICAgICAgICAgIGMuY2FjaGUubGF0ZXN0ID0gbmV3IERhdGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGMuY2FjaGUgPSBuZXcgQ2FjaGVDb250cm9sKHsgdHRsOiBkZWZhdWx0VHRsIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBSZXR1cm4gdGhlIG1vZGVsLCB1cGRhdGVkIG9yIGp1c3QgY3JlYXRlZFxyXG4gICAgICAgIHJldHVybiBjLm1vZGVsO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBHZXQgdGhlIGNvbnRlbnQgZnJvbSB0aGUgY2FjaGUsIGZvciBmdWxsIHByb2ZpbGVcclxuICAgICAgICBhbmQgc2F2ZSBpdCBpbiBsb2NhbCBzdG9yYWdlXHJcbiAgICAqKi9cclxuICAgIGZ1bmN0aW9uIHNhdmVDYWNoZUluTG9jYWwoKSB7XHJcbiAgICAgICAgdmFyIHBsYWluID0gY2FjaGUudXNlckpvYlByb2ZpbGUubGlzdC5tYXAoZnVuY3Rpb24oaXRlbSkge1xyXG4gICAgICAgICAgICAvLyBFYWNoIGl0ZW0gaXMgYSBtb2RlbCwgZ2V0IGl0IGluIHBsYWluOlxyXG4gICAgICAgICAgICByZXR1cm4gaXRlbS5tb2RlbC50b1BsYWluT2JqZWN0KCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgbG9jYWxmb3JhZ2Uuc2V0SXRlbSgndXNlckpvYlByb2ZpbGUnLCBwbGFpbik7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFByaXZhdGUsIGZldGNoIGZyb20gcmVtb3RlXHJcbiAgICB2YXIgZmV0Y2hVc2VySm9iUHJvZmlsZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBUaGlyZCBhbmQgbGFzdCwgcmVtb3RlIGxvYWRpbmdcclxuICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5nZXQoJ3VzZXItam9iLXByb2ZpbGUnKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChyYXcpIHtcclxuICAgICAgICAgICAgLy8gQ2FjaGUgaW4gbG9jYWwgc3RvcmFnZVxyXG4gICAgICAgICAgICBsb2NhbGZvcmFnZS5zZXRJdGVtKCd1c2VySm9iUHJvZmlsZScsIHJhdyk7XHJcbiAgICAgICAgICAgIHJldHVybiBtYXBUb1VzZXJKb2JQcm9maWxlKHJhdyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBQdWJsaWMgQVBJXHJcbiAgICAgICAgR2V0IHRoZSBjb21wbGV0ZSBsaXN0IG9mIFVzZXJKb2JUaXRsZSBmb3JcclxuICAgICAgICBhbGwgdGhlIEpvYlRpdGxlcyBhc3NpZ25lZCB0byB0aGUgY3VycmVudCB1c2VyXHJcbiAgICAqKi9cclxuICAgIGFwaS5nZXRVc2VySm9iUHJvZmlsZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBJZiBubyBjYWNoZSBvciBtdXN0IHJldmFsaWRhdGUsIGdvIHJlbW90ZVxyXG4gICAgICAgIGlmIChjYWNoZS51c2VySm9iUHJvZmlsZS5jYWNoZS5tdXN0UmV2YWxpZGF0ZSgpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmZXRjaFVzZXJKb2JQcm9maWxlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBGaXJzdCwgdHJ5IGNhY2hlXHJcbiAgICAgICAgICAgIGlmIChjYWNoZS51c2VySm9iUHJvZmlsZS5saXN0KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjYWNoZS51c2VySm9iUHJvZmlsZS5saXN0KTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgLy8gU2Vjb25kLCBsb2NhbCBzdG9yYWdlXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0VXNlckpvYlByb2ZpbGVGcm9tTG9jYWwoKVxyXG4gICAgICAgICAgICAgICAgLy8gRmFsbGJhY2sgdG8gcmVtb3RlIGlmIG5vdCBmb3VuZCBpbiBsb2NhbFxyXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZldGNoVXNlckpvYlByb2ZpbGUpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBcclxuICAgIC8vIFByaXZhdGUsIGZldGNoIGZyb20gcmVtb3RlXHJcbiAgICB2YXIgZmV0Y2hVc2VySm9iVGl0bGUgPSBmdW5jdGlvbihqb2JUaXRsZUlEKSB7XHJcbiAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QuZ2V0KCd1c2VyLWpvYi1wcm9maWxlLycgKyBqb2JUaXRsZUlEKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJhdykge1xyXG4gICAgICAgICAgICAvLyBTYXZlIHRvIGNhY2hlIGFuZCBnZXQgbW9kZWxcclxuICAgICAgICAgICAgdmFyIG0gPSBzZXRHZXRVc2VySm9iVGl0bGVUb0NhY2hlKHJhdyk7XHJcbiAgICAgICAgICAgIC8vIFNhdmUgaW4gbG9jYWxcclxuICAgICAgICAgICAgc2F2ZUNhY2hlSW5Mb2NhbCgpO1xyXG4gICAgICAgICAgICAvLyBSZXR1cm4gbW9kZWxcclxuICAgICAgICAgICAgcmV0dXJuIG07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBQdWJsaWMgQVBJXHJcbiAgICAgICAgR2V0IGEgVXNlckpvYlRpdGxlIHJlY29yZCBmb3IgdGhlIGdpdmVuXHJcbiAgICAgICAgSm9iVGl0bGVJRCBhbmQgdGhlIGN1cnJlbnQgdXNlci5cclxuICAgICoqL1xyXG4gICAgYXBpLmdldFVzZXJKb2JUaXRsZSA9IGZ1bmN0aW9uIChqb2JUaXRsZUlEKSB7XHJcbiAgICAgICAgLy8gUXVpY2sgZXJyb3JcclxuICAgICAgICBpZiAoIWpvYlRpdGxlSUQpIHJldHVybiBQcm9taXNlLnJlamVjdCgnSm9iIFRpdGxlIElEIHJlcXVpcmVkJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSWYgbm8gY2FjaGUgb3IgbXVzdCByZXZhbGlkYXRlLCBnbyByZW1vdGVcclxuICAgICAgICBpZiAoIWNhY2hlLnVzZXJKb2JUaXRsZXNbam9iVGl0bGVJRF0gfHxcclxuICAgICAgICAgICAgY2FjaGUudXNlckpvYlRpdGxlc1tqb2JUaXRsZUlEXS5jYWNoZS5tdXN0UmV2YWxpZGF0ZSgpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmZXRjaFVzZXJKb2JUaXRsZShqb2JUaXRsZUlEKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIEZpcnN0LCB0cnkgY2FjaGVcclxuICAgICAgICAgICAgaWYgKGNhY2hlLnVzZXJKb2JUaXRsZXNbam9iVGl0bGVJRF0gJiZcclxuICAgICAgICAgICAgICAgIGNhY2hlLnVzZXJKb2JUaXRsZXNbam9iVGl0bGVJRF0ubW9kZWwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2FjaGUudXNlckpvYlRpdGxlc1tqb2JUaXRsZUlEXS5tb2RlbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBTZWNvbmQsIGxvY2FsIHN0b3JhZ2UsIHdoZXJlIHdlIGhhdmUgdGhlIGZ1bGwgam9iIHByb2ZpbGVcclxuICAgICAgICAgICAgICAgIHJldHVybiBnZXRVc2VySm9iUHJvZmlsZUZyb21Mb2NhbCgpXHJcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbigvKnVzZXJKb2JQcm9maWxlKi8pIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBOb3QgbmVlZCBmb3IgdGhlIHBhcmFtZXRlciwgdGhlIGRhdGEgaXNcclxuICAgICAgICAgICAgICAgICAgICAvLyBpbiBtZW1vcnkgYW5kIGluZGV4ZWQsIGxvb2sgZm9yIHRoZSBqb2IgdGl0bGVcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGUudXNlckpvYlRpdGxlc1tqb2JUaXRsZUlEXS5tb2RlbDtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAvLyBJZiBubyBsb2NhbCBjb3B5IChlcnJvciBvbiBwcm9taXNlKSxcclxuICAgICAgICAgICAgICAgIC8vIG9yIHRoYXQgZG9lcyBub3QgY29udGFpbnMgdGhlIGpvYiB0aXRsZSAoZXJyb3Igb24gJ3RoZW4nKTpcclxuICAgICAgICAgICAgICAgIC8vIFRoaXJkIGFuZCBsYXN0LCByZW1vdGUgbG9hZGluZ1xyXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZldGNoVXNlckpvYlRpdGxlLmJpbmQobnVsbCwgam9iVGl0bGVJRCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGFwaTtcclxufTtcclxuIiwiLyoqIFVzZXJQcm9maWxlXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgVXNlciA9IHJlcXVpcmUoJy4uL21vZGVscy9Vc2VyJyk7XHJcblxyXG52YXIgUmVtb3RlTW9kZWwgPSByZXF1aXJlKCcuLi91dGlscy9SZW1vdGVNb2RlbCcpO1xyXG5cclxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoYXBwTW9kZWwpIHtcclxuICAgIHJldHVybiBuZXcgUmVtb3RlTW9kZWwoe1xyXG4gICAgICAgIGRhdGE6IFVzZXIubmV3QW5vbnltb3VzKCksXHJcbiAgICAgICAgdHRsOiB7IG1pbnV0ZXM6IDEgfSxcclxuICAgICAgICAvLyBJTVBPUlRBTlQ6IEtlZXAgdGhlIG5hbWUgaW4gc3luYyB3aXRoIHNldC11cCBhdCBBcHBNb2RlbC1hY2NvdW50XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlTmFtZTogJ3Byb2ZpbGUnLFxyXG4gICAgICAgIGZldGNoOiBmdW5jdGlvbiBmZXRjaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QuZ2V0KCdwcm9maWxlJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXNoOiBmdW5jdGlvbiBwdXNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5wdXQoJ3Byb2ZpbGUnLCB0aGlzLmRhdGEubW9kZWwudG9QbGFpbk9iamVjdCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBTaW1wbGUgVmlldyBNb2RlbCB3aXRoIG1haW4gY3JlZGVudGlhbHMgZm9yXHJcbiAgICB1c2UgaW4gYSBmb3JtLCB3aXRoIHZhbGlkYXRpb24uXHJcbiAgICBVc2VkIGJ5IExvZ2luIGFuZCBTaWdudXAgYWN0aXZpdGllc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxuXHJcbmZ1bmN0aW9uIEZvcm1DcmVkZW50aWFscygpIHtcclxuXHJcbiAgICB0aGlzLnVzZXJuYW1lID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcbiAgICB0aGlzLnBhc3N3b3JkID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcbiAgICBcclxuICAgIC8vIHZhbGlkYXRlIHVzZXJuYW1lIGFzIGFuIGVtYWlsXHJcbiAgICB2YXIgZW1haWxSZWdleHAgPSAvXlstMC05QS1aYS16ISMkJSYnKisvPT9eX2B7fH1+Ll0rQFstMC05QS1aYS16ISMkJSYnKisvPT9eX2B7fH1+Ll0rJC87XHJcbiAgICB0aGlzLnVzZXJuYW1lLmVycm9yID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcbiAgICB0aGlzLnVzZXJuYW1lLnN1YnNjcmliZShmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgaWYgKHYpIHtcclxuICAgICAgICAgICAgaWYgKGVtYWlsUmVnZXhwLnRlc3QodikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWUuZXJyb3IoJycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZS5lcnJvcignSXMgbm90IGEgdmFsaWQgZW1haWwnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy51c2VybmFtZS5lcnJvcignUmVxdWlyZWQnKTtcclxuICAgICAgICB9XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgXHJcbiAgICAvLyByZXF1aXJlZCBwYXNzd29yZFxyXG4gICAgdGhpcy5wYXNzd29yZC5lcnJvciA9IGtvLm9ic2VydmFibGUoJycpO1xyXG4gICAgdGhpcy5wYXNzd29yZC5zdWJzY3JpYmUoZnVuY3Rpb24odikge1xyXG4gICAgICAgIHZhciBlcnIgPSAnJztcclxuICAgICAgICBpZiAoIXYpXHJcbiAgICAgICAgICAgIGVyciA9ICdSZXF1aXJlZCc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5wYXNzd29yZC5lcnJvcihlcnIpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGb3JtQ3JlZGVudGlhbHM7XHJcbiIsIi8qKiBOYXZBY3Rpb24gdmlldyBtb2RlbC5cclxuICAgIEl0IGFsbG93cyBzZXQtdXAgcGVyIGFjdGl2aXR5IGZvciB0aGUgQXBwTmF2IGFjdGlvbiBidXR0b24uXHJcbioqL1xyXG52YXIgTW9kZWwgPSByZXF1aXJlKCcuLi9tb2RlbHMvTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIE5hdkFjdGlvbih2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgbGluazogJycsXHJcbiAgICAgICAgaWNvbjogJycsXHJcbiAgICAgICAgdGV4dDogJycsXHJcbiAgICAgICAgLy8gJ1Rlc3QnIGlzIHRoZSBoZWFkZXIgdGl0bGUgYnV0IHBsYWNlZCBpbiB0aGUgYnV0dG9uL2FjdGlvblxyXG4gICAgICAgIGlzVGl0bGU6IGZhbHNlLFxyXG4gICAgICAgIC8vICdMaW5rJyBpcyB0aGUgZWxlbWVudCBJRCBvZiBhIG1vZGFsIChzdGFydHMgd2l0aCBhICMpXHJcbiAgICAgICAgaXNNb2RhbDogZmFsc2UsXHJcbiAgICAgICAgLy8gJ0xpbmsnIGlzIGEgU2hlbGwgY29tbWFuZCwgbGlrZSAnZ29CYWNrIDInXHJcbiAgICAgICAgaXNTaGVsbDogZmFsc2UsXHJcbiAgICAgICAgLy8gU2V0IGlmIHRoZSBlbGVtZW50IGlzIGEgbWVudSBidXR0b24sIGluIHRoYXQgY2FzZSAnbGluaydcclxuICAgICAgICAvLyB3aWxsIGJlIHRoZSBJRCBvZiB0aGUgbWVudSAoY29udGFpbmVkIGluIHRoZSBwYWdlOyB3aXRob3V0IHRoZSBoYXNoKSwgdXNpbmdcclxuICAgICAgICAvLyB0aGUgdGV4dCBhbmQgaWNvbiBidXQgc3BlY2lhbCBtZWFuaW5nIGZvciB0aGUgdGV4dCB2YWx1ZSAnbWVudSdcclxuICAgICAgICAvLyBvbiBpY29uIHByb3BlcnR5IHRoYXQgd2lsbCB1c2UgdGhlIHN0YW5kYXJkIG1lbnUgaWNvbi5cclxuICAgICAgICBpc01lbnU6IGZhbHNlXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE5hdkFjdGlvbjtcclxuXHJcbi8vIFNldCBvZiB2aWV3IHV0aWxpdGllcyB0byBnZXQgdGhlIGxpbmsgZm9yIHRoZSBleHBlY3RlZCBodG1sIGF0dHJpYnV0ZXNcclxuXHJcbk5hdkFjdGlvbi5wcm90b3R5cGUuZ2V0SHJlZiA9IGZ1bmN0aW9uIGdldEhyZWYoKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgICh0aGlzLmlzTWVudSgpIHx8IHRoaXMuaXNNb2RhbCgpIHx8IHRoaXMuaXNTaGVsbCgpKSA/XHJcbiAgICAgICAgJyMnIDpcclxuICAgICAgICB0aGlzLmxpbmsoKVxyXG4gICAgKTtcclxufTtcclxuXHJcbk5hdkFjdGlvbi5wcm90b3R5cGUuZ2V0TW9kYWxUYXJnZXQgPSBmdW5jdGlvbiBnZXRNb2RhbFRhcmdldCgpIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgKHRoaXMuaXNNZW51KCkgfHwgIXRoaXMuaXNNb2RhbCgpIHx8IHRoaXMuaXNTaGVsbCgpKSA/XHJcbiAgICAgICAgJycgOlxyXG4gICAgICAgIHRoaXMubGluaygpXHJcbiAgICApO1xyXG59O1xyXG5cclxuTmF2QWN0aW9uLnByb3RvdHlwZS5nZXRTaGVsbENvbW1hbmQgPSBmdW5jdGlvbiBnZXRTaGVsbENvbW1hbmQoKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgICh0aGlzLmlzTWVudSgpIHx8ICF0aGlzLmlzU2hlbGwoKSkgP1xyXG4gICAgICAgICcnIDpcclxuICAgICAgICB0aGlzLmxpbmsoKVxyXG4gICAgKTtcclxufTtcclxuXHJcbk5hdkFjdGlvbi5wcm90b3R5cGUuZ2V0TWVudUlEID0gZnVuY3Rpb24gZ2V0TWVudUlEKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgICAoIXRoaXMuaXNNZW51KCkpID9cclxuICAgICAgICAnJyA6XHJcbiAgICAgICAgdGhpcy5saW5rKClcclxuICAgICk7XHJcbn07XHJcblxyXG5OYXZBY3Rpb24ucHJvdG90eXBlLmdldE1lbnVMaW5rID0gZnVuY3Rpb24gZ2V0TWVudUxpbmsoKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgICghdGhpcy5pc01lbnUoKSkgP1xyXG4gICAgICAgICcnIDpcclxuICAgICAgICAnIycgKyB0aGlzLmxpbmsoKVxyXG4gICAgKTtcclxufTtcclxuXHJcbi8qKiBTdGF0aWMsIHNoYXJlZCBhY3Rpb25zICoqL1xyXG5OYXZBY3Rpb24uZ29Ib21lID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnLycsXHJcbiAgICBpY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1ob21lJ1xyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5nb0JhY2sgPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICdnb0JhY2snLFxyXG4gICAgaWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tYXJyb3ctbGVmdCcsXHJcbiAgICBpc1NoZWxsOiB0cnVlXHJcbn0pO1xyXG5cclxuLy8gVE9ETyBUTyBSRU1PVkUsIEV4YW1wbGUgb2YgbW9kYWxcclxuTmF2QWN0aW9uLm5ld0l0ZW0gPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICcjbmV3SXRlbScsXHJcbiAgICBpY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgIGlzTW9kYWw6IHRydWVcclxufSk7XHJcblxyXG5OYXZBY3Rpb24ubWVudUluID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnbWVudUluJyxcclxuICAgIGljb246ICdtZW51JyxcclxuICAgIGlzTWVudTogdHJ1ZVxyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5tZW51T3V0ID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnbWVudU91dCcsXHJcbiAgICBpY29uOiAnbWVudScsXHJcbiAgICBpc01lbnU6IHRydWVcclxufSk7XHJcblxyXG5OYXZBY3Rpb24ubWVudU5ld0l0ZW0gPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICdtZW51TmV3SXRlbScsXHJcbiAgICBpY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgIGlzTWVudTogdHJ1ZVxyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5nb0hlbHBJbmRleCA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgbGluazogJyNoZWxwSW5kZXgnLFxyXG4gICAgdGV4dDogJ2hlbHAnLFxyXG4gICAgaXNNb2RhbDogdHJ1ZVxyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5nb0xvZ2luID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnL2xvZ2luJyxcclxuICAgIHRleHQ6ICdsb2ctaW4nXHJcbn0pO1xyXG5cclxuTmF2QWN0aW9uLmdvTG9nb3V0ID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnL2xvZ291dCcsXHJcbiAgICB0ZXh0OiAnbG9nLW91dCdcclxufSk7XHJcblxyXG5OYXZBY3Rpb24uZ29TaWdudXAgPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICcvc2lnbnVwJyxcclxuICAgIHRleHQ6ICdzaWduLXVwJ1xyXG59KTtcclxuIiwiLyoqIE5hdkJhciB2aWV3IG1vZGVsLlxyXG4gICAgSXQgYWxsb3dzIGN1c3RvbWl6ZSB0aGUgTmF2QmFyIHBlciBhY3Rpdml0eS5cclxuKiovXHJcbnZhciBNb2RlbCA9IHJlcXVpcmUoJy4uL21vZGVscy9Nb2RlbCcpO1xyXG4gICAgLy9OYXZBY3Rpb24gPSByZXF1aXJlKCcuL05hdkFjdGlvbicpO1xyXG5cclxuZnVuY3Rpb24gTmF2QmFyKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICAvLyBUaXRsZSBzaG93ZWQgaW4gdGhlIGNlbnRlclxyXG4gICAgICAgIC8vIFdoZW4gdGhlIHRpdGxlIGlzICdudWxsJywgdGhlIGFwcCBsb2dvIGlzIHNob3dlZCBpbiBwbGFjZSxcclxuICAgICAgICAvLyBvbiBlbXB0eSB0ZXh0LCB0aGUgZW1wdHkgdGV4dCBpcyBzaG93ZWQgYW5kIG5vIGxvZ28uXHJcbiAgICAgICAgdGl0bGU6ICcnLFxyXG4gICAgICAgIC8vIE5hdkFjdGlvbiBpbnN0YW5jZTpcclxuICAgICAgICBsZWZ0QWN0aW9uOiBudWxsLFxyXG4gICAgICAgIC8vIE5hdkFjdGlvbiBpbnN0YW5jZTpcclxuICAgICAgICByaWdodEFjdGlvbjogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBOYXZCYXI7XHJcbiIsIi8qKlxyXG4gICAgVGltZVNsb3QgdmlldyBtb2RlbCAoYWthOiBDYWxlbmRhclNsb3QpIGZvciB1c2VcclxuICAgIGFzIHBhcnQgb2YgdGhlIHRlbXBsYXRlL2NvbXBvbmVudCB0aW1lLXNsb3QtdGlsZSBvciBhY3Rpdml0aWVzXHJcbiAgICBwcm92aWRpbmcgZGF0YSBmb3IgdGhlIHRlbXBsYXRlLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGdldE9ic2VydmFibGUgPSByZXF1aXJlKCcuLi91dGlscy9nZXRPYnNlcnZhYmxlJyk7XHJcblxyXG5mdW5jdGlvbiBUaW1lU2xvdFZpZXdNb2RlbChwYXJhbXMpIHtcclxuICAgIC8qanNoaW50IG1heGNvbXBsZXhpdHk6OSovXHJcblxyXG4gICAgdGhpcy5zdGFydFRpbWUgPSBnZXRPYnNlcnZhYmxlKHBhcmFtcy5zdGFydFRpbWUgfHwgbnVsbCk7XHJcbiAgICB0aGlzLmVuZFRpbWUgPSBnZXRPYnNlcnZhYmxlKHBhcmFtcy5lbmRUaW1lIHx8IG51bGwpO1xyXG4gICAgdGhpcy5zdWJqZWN0ID0gZ2V0T2JzZXJ2YWJsZShwYXJhbXMuc3ViamVjdCB8fCBudWxsKTtcclxuICAgIHRoaXMuZGVzY3JpcHRpb24gPSBnZXRPYnNlcnZhYmxlKHBhcmFtcy5kZXNjcmlwdGlvbiB8fCBudWxsKTtcclxuICAgIHRoaXMubGluayA9IGdldE9ic2VydmFibGUocGFyYW1zLmxpbmsgfHwgbnVsbCk7XHJcbiAgICB0aGlzLmFjdGlvbkljb24gPSBnZXRPYnNlcnZhYmxlKHBhcmFtcy5hY3Rpb25JY29uIHx8IG51bGwpO1xyXG4gICAgdGhpcy5hY3Rpb25UZXh0ID0gZ2V0T2JzZXJ2YWJsZShwYXJhbXMuYWN0aW9uVGV4dCB8fCBudWxsKTtcclxuICAgIHRoaXMuY2xhc3NOYW1lcyA9IGdldE9ic2VydmFibGUocGFyYW1zLmNsYXNzTmFtZXMgfHwgbnVsbCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGltZVNsb3RWaWV3TW9kZWw7XHJcblxyXG52YXIgbnVtZXJhbCA9IHJlcXVpcmUoJ251bWVyYWwnKTtcclxuXHJcbi8qKlxyXG4gICAgU3RhdGljIGNvbnN0cnVjdG9yIHRvIGNvbnZlcnQgYW4gQXBwb2ludG1lbnQgbW9kZWwgaW50byBcclxuICAgIGEgVGltZVNsb3QgaW5zdGFuY2UgZm9sbG93aW5nIFVJIGNyaXRlcmlhIGZvciBwcmVzZXQgdmFsdWVzL3NldHVwLlxyXG4qKi9cclxuVGltZVNsb3RWaWV3TW9kZWwuZnJvbUFwcG9pbnRtZW50ID0gZnVuY3Rpb24gZnJvbUFwcG9pbnRtZW50KGFwdCkge1xyXG4gICAgLypqc2hpbnQgbWF4Y29tcGxleGl0eTo4ICovXHJcbiAgICByZXR1cm4gbmV3IFRpbWVTbG90Vmlld01vZGVsKHtcclxuICAgICAgICBzdGFydFRpbWU6IGFwdC5zdGFydFRpbWUsXHJcbiAgICAgICAgZW5kVGltZTogYXB0LmVuZFRpbWUsXHJcbiAgICAgICAgc3ViamVjdDogYXB0LnN1bW1hcnksXHJcbiAgICAgICAgZGVzY3JpcHRpb246IGFwdC5kZXNjcmlwdGlvbixcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC8nICsgYXB0LmlkKCksXHJcbiAgICAgICAgYWN0aW9uSWNvbjogKGFwdC5zb3VyY2VCb29raW5nKCkgPyBudWxsIDogYXB0LnNvdXJjZUV2ZW50KCkgPyAnZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0JyA6ICFhcHQuaWQoKSA/ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnIDogbnVsbCksXHJcbiAgICAgICAgYWN0aW9uVGV4dDogKFxyXG4gICAgICAgICAgICBhcHQuc291cmNlQm9va2luZygpICYmIFxyXG4gICAgICAgICAgICBhcHQuc291cmNlQm9va2luZygpLmJvb2tpbmdSZXF1ZXN0KCkgJiYgXHJcbiAgICAgICAgICAgIGFwdC5zb3VyY2VCb29raW5nKCkuYm9va2luZ1JlcXVlc3QoKS5wcmljaW5nRXN0aW1hdGUoKSA/IFxyXG4gICAgICAgICAgICBudW1lcmFsKGFwdC5zb3VyY2VCb29raW5nKCkuYm9va2luZ1JlcXVlc3QoKS5wcmljaW5nRXN0aW1hdGUoKS50b3RhbFByaWNlKCkgfHwgMCkuZm9ybWF0KCckMC4wMCcpIDpcclxuICAgICAgICAgICAgbnVsbFxyXG4gICAgICAgICksXHJcbiAgICAgICAgY2xhc3NOYW1lczogKGFwdC5pZCgpID8gbnVsbCA6ICdMaXN0Vmlldy1pdGVtLS10YWctc3VjY2VzcycpXHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBVc2VySm9iUHJvZmlsZVZpZXdNb2RlbDogbG9hZHMgZGF0YSBhbmQga2VlcCBzdGF0ZVxyXG4gICAgdG8gZGlzcGxheSB0aGUgbGlzdGluZyBvZiBqb2IgdGl0bGVzIGZyb20gdGhlIFxyXG4gICAgdXNlciBqb2IgcHJvZmlsZS5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcblxyXG5mdW5jdGlvbiBVc2VySm9iUHJvZmlsZVZpZXdNb2RlbChhcHApIHtcclxuICAgIFxyXG4gICAgdGhpcy51c2VySm9iUHJvZmlsZSA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcblxyXG4gICAgdGhpcy5pc0ZpcnN0VGltZSA9IGtvLm9ic2VydmFibGUodHJ1ZSk7XHJcbiAgICB0aGlzLmlzTG9hZGluZyA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgdGhpcy5pc1N5bmNpbmcgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuICAgIHRoaXMudGhlcmVJc0Vycm9yID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcbiAgICBcclxuICAgIC8vIExvYWQgYW5kIHNhdmUgam9iIHRpdGxlIGluZm9cclxuICAgIHZhciBqb2JUaXRsZXNJbmRleCA9IHt9O1xyXG4gICAgZnVuY3Rpb24gc3luY0pvYlRpdGxlKGpvYlRpdGxlSUQpIHtcclxuICAgICAgICByZXR1cm4gYXBwLm1vZGVsLmpvYlRpdGxlcy5nZXRKb2JUaXRsZShqb2JUaXRsZUlEKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGpvYlRpdGxlKSB7XHJcbiAgICAgICAgICAgIGpvYlRpdGxlc0luZGV4W2pvYlRpdGxlSURdID0gam9iVGl0bGU7XHJcblxyXG4gICAgICAgICAgICAvLyBUT0RPOiBlcnJvcnM/IG5vdC1mb3VuZCBqb2IgdGl0bGU/XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICAvLyBDcmVhdGVzIGEgJ2pvYlRpdGxlJyBvYnNlcnZhYmxlIG9uIHRoZSB1c2VySm9iVGl0bGVcclxuICAgIC8vIG1vZGVsIHRvIGhhdmUgYWNjZXNzIHRvIGEgY2FjaGVkIGpvYlRpdGxlIG1vZGVsLlxyXG4gICAgZnVuY3Rpb24gYXR0YWNoSm9iVGl0bGUodXNlckpvYlRpdGxlKSB7XHJcbiAgICAgICAgdXNlckpvYlRpdGxlLmpvYlRpdGxlID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgcmV0dXJuIGpvYlRpdGxlc0luZGV4W3RoaXMuam9iVGl0bGVJRCgpXTtcclxuICAgICAgICB9LCB1c2VySm9iVGl0bGUpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB2YXIgc2hvd0xvYWRpbmdFcnJvciA9IGZ1bmN0aW9uIHNob3dMb2FkaW5nRXJyb3IoZXJyKSB7XHJcbiAgICAgICAgYXBwLm1vZGFscy5zaG93RXJyb3Ioe1xyXG4gICAgICAgICAgICB0aXRsZTogJ0FuIGVycm9yIGhhcHBlbmluZyB3aGVuIGxvYWRpbmcgeW91ciBqb2IgcHJvZmlsZS4nLFxyXG4gICAgICAgICAgICBlcnJvcjogZXJyICYmIGVyci5lcnJvciB8fCBlcnJcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmlzTG9hZGluZyhmYWxzZSk7XHJcbiAgICAgICAgdGhpcy5pc1N5bmNpbmcoZmFsc2UpO1xyXG4gICAgICAgIHRoaXMudGhlcmVJc0Vycm9yKHRydWUpO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG5cclxuICAgIC8vIExvYWRpbmcgYW5kIHN5bmMgb2YgZGF0YVxyXG4gICAgdGhpcy5zeW5jID0gZnVuY3Rpb24gc3luYygpIHtcclxuICAgICAgICB2YXIgZmlyc3RUaW1lID0gdGhpcy5pc0ZpcnN0VGltZSgpO1xyXG4gICAgICAgIHRoaXMuaXNGaXJzdFRpbWUoZmFsc2UpO1xyXG5cclxuICAgICAgICBpZiAoZmlyc3RUaW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5pc1N5bmNpbmcodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBLZWVwIGRhdGEgdXBkYXRlZDpcclxuICAgICAgICBhcHAubW9kZWwudXNlckpvYlByb2ZpbGUuZ2V0VXNlckpvYlByb2ZpbGUoKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHVzZXJKb2JQcm9maWxlKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBXZSBuZWVkIHRoZSBqb2IgdGl0bGVzIGluZm8gYmVmb3JlIGVuZFxyXG4gICAgICAgICAgICBQcm9taXNlLmFsbCh1c2VySm9iUHJvZmlsZS5tYXAoZnVuY3Rpb24odXNlckpvYlRpdGxlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3luY0pvYlRpdGxlKHVzZXJKb2JUaXRsZS5qb2JUaXRsZUlEKCkpO1xyXG4gICAgICAgICAgICB9KSlcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGpvYlRpdGxlIHByb3BlcnR5IGJlZm9yZSB1cGRhdGVcclxuICAgICAgICAgICAgICAgIC8vIG9ic2VydmFibGUgd2l0aCB0aGUgcHJvZmlsZVxyXG4gICAgICAgICAgICAgICAgdXNlckpvYlByb2ZpbGUuZm9yRWFjaChhdHRhY2hKb2JUaXRsZSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlckpvYlByb2ZpbGUodXNlckpvYlByb2ZpbGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNTeW5jaW5nKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudGhlcmVJc0Vycm9yKGZhbHNlKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKVxyXG4gICAgICAgICAgICAuY2F0Y2goc2hvd0xvYWRpbmdFcnJvcik7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxyXG4gICAgICAgIC5jYXRjaChzaG93TG9hZGluZ0Vycm9yKTtcclxuXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVXNlckpvYlByb2ZpbGVWaWV3TW9kZWw7XHJcbiJdfQ==
;