'use strict';

var ko = require('knockout'),
    $ = require('jquery');

// internal utility function 'to string with two digits almost'
function twoDigits(n) {
    return Math.floor(n / 10) + '' + n % 10;
}

/**
    Shows a time picker, based on different dropdowns for each time part.
    Supports hours and minutes (with am/pm for US locale)
    @param options:Object {
        title:string Optional. The text to show in the modal's header,
            with fallback to the Modal's default title.
    }
    @returns Promise. It resolves when a button is pressed, with null on 'unset'
    and an object with { time:object, timeString:string } on 'select'.
    The time object is just a plain object as { hours: 0, minutes: 0, seconds: 0 }
    Is rejected when the modal is dismissed/closed without 'unset' or 'select'.
**/
exports.show = function showTimePicker(options) {
    //jshint maxcomplexity:10

    var modal = $('#timePickerModal'),
        vm = modal.data('viewmodel');
    
    if (!vm) {
        vm = new TimePickerModel();

        ko.applyBindings(vm, modal.get(0));
        modal.data('viewmodel', vm);
    }

    options = options || {};
    
    // Fallback title
    vm.title(options.title || 'Select time');
    vm.stepInMinutes(options.stepInMinutes || 5);
    if (typeof(options.selectedTime) === 'string') {
        vm.selectedTimeString(options.selectedTime);
    }
    else {
        vm.selectedTime(options.selectedTime || {});
    }
    vm.unsetLabel(options.unsetLabel || 'Remove');
    vm.selectLabel(options.selectLabel || 'Select');
    
    return new Promise(function(resolve, reject) {
        
        // Handlers
        var unset = function() {
            resolve(null);
            modal.modal('hide');
        };
        var select = function() {
            resolve({
                time: vm.selectedTime(),
                timeString: vm.selectedTimeString()
            });
            modal.modal('hide');
        };

        // Just closed without pick anything, rejects
        modal.off('hide.bs.modal');
        modal.on('hide.bs.modal', reject);
        modal.off('click', '.timePickerModal-unset');
        modal.on('click', '.timePickerModal-unset', unset);
        modal.off('click', '.timePickerModal-select');
        modal.on('click', '.timePickerModal-select', select);

        modal.modal('show');
    });
};

function TimePickerModel() {
    
    // Set-up viewmodel and binding
    var vm = {
        title: ko.observable(''),
        pickedHour: ko.observable(null),
        pickedMinute: ko.observable(null),
        pickedAmpm: ko.observable(null),
        stepInMinutes: ko.observable(5),
        unsetLabel: ko.observable('Remove'),
        selectLabel: ko.observable('Select')
    };
    // TODO: Make localization changes with any app locale change, with timeinterval,
    // as a computed or changed by events:
    vm.locale = ko.observable({ lang: 'en', region: 'US' });

    vm.hourValues = ko.computed(function() {
        var region = this.locale().region;
        var step = (this.stepInMinutes() / 60) |0;
        // IMPORTANT: avoid infinite loops:
        if (step <= 0) step = 1;
        var values = [],
            i;
        if (region === 'US') {
            values.push({
                value: 0,
                label: 12
            });
            for (i = 1; i < 12; i += step) {
                values.push({
                    value: i,
                    label: i
                });
            }
        } else {
            for (i = 0; i < 24; i += step) {
                values.push({
                    value: i,
                    label: i
                });
            }
        }
        return values;
    }, vm);
    vm.minuteValues = ko.computed(function() {
        //var region = this.locale().region;
        var step = this.stepInMinutes() |0;
        // IMPORTANT: avoid infinite loops:
        if (step <= 0) step = 1;
        // No minutes?
        if (step >= 60) return [];

        var values = [];
        //if (region === 'US') {
        for (var i = 0; i < 60; i += step) {
            values.push({
                value: i,
                label: twoDigits(i)
            });
        }
        return values;
    }, vm);
    vm.ampmValues = ko.computed(function() {
        var region = this.locale().region;

        var values = [];
        if (region === 'US') {
            values.push({
                value: 0, // added to hours
                label: 'AM'
            });
            values.push({
                value: 12, // added to hours
                label: 'PM'
            });
        }
        return values;
    }, vm);

    vm.selectedTime = ko.computed({
        read: function() {
            return {
                hours: this.pickedHour() + this.pickedAmpm(),
                minutes: this.pickedMinute(),
                seconds: 0
            };
        },
        write: function(v) {
            if (typeof(v) !== 'object') throw new Error('Invalid input for the time picker. Value:', v);
            v = v || {};
            var region = this.locale().region;
            if (region === 'US') {
                this.pickedHour((v.hours / 12) |0);
                this.pickedMinute(v.minutes |0);
                this.pickedAmpm((v.hours % 12) |0);
            }
            else {
                this.pickedHour(v.hours |0);
                this.pickedMinute(v.minutes |0);
                this.pickedAmpm(0);
            }
        },
        owner: vm
    });

    vm.selectedTimeString = ko.computed({
        read: function() {
            var t = this.selectedTime();
            return twoDigits(t.hours) + ':' + twoDigits(t.minutes) + ':' + twoDigits(t.seconds);
        },
        write: function(v) {
            v = v || '';
            var parts = v.split(':');
            this.selectedTime({
                hours: parts[0] |0,
                minutes: parts[1] |0,
                seconds: parts[2] |0
            });
        },
        owner: vm
    });
    
    return vm;
}
