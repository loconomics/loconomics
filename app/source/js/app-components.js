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
    $ = require('jquery'),
    propTools = require('./utils/jsPropertiesTools'),
    getObservable = require('./utils/getObservable');

exports.registerAll = function(app) {
    
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
            
            var userAttr = getObservable(params.attr);
            this.attr = ko.pureComputed(function() {
                var attr = userAttr() || {};
                return $.extend({}, attr, {
                    'aria-label': this.placeholder(),
                    placeholder: this.placeholder(),
                    type: this.type()
                });
            }, this);
            
            var type = getObservable(params.type);            
            this.type = ko.computed(function() {
                return type() || 'text';
            }, this);
        }
    });
    
    /// feedback-entry
    ko.components.register('app-feedback-entry', {
        template: { element: 'feedback-entry-template' },
        viewModel: function(params) {

            this.section = getObservable(params.section || '');
            this.url = ko.pureComputed(function() {
                return '/feedbackForm/' + this.section();
            }, this);
        }
    });
    
    /// feedback-entry
    ko.components.register('app-time-slot-tile', {
        template: { element: 'time-slot-tile-template' },
        viewModel: require('./viewmodels/TimeSlot')
    });
    
    /// loading-spinner
    ko.components.register('app-loading-spinner', {
        template: { element: 'loading-spinner-template' },
        viewModel: function(params) {
            var base = 'loadingSpinner';
            this.mod = getObservable(params.mod || '');
            this.cssClass = ko.pureComputed(function() {
                var c = base,
                    mods = (this.mod() || '').split(' ');
                if (mods.length)
                    c += ' ' + base + '--' + mods.join(' ' + base + '--');
                return c;
            }, this);
        }
    });

    /// appointment-card
    ko.components.register('app-appointment-card', {
        template: { element: 'appointment-card-template' },
        viewModel: require('./viewmodels/AppointmentCard')
    });
    
    /// job titles list
    ko.components.register('app-job-titles-list', {
        template: { element: 'job-titles-list-template' },
        viewModel: function(params) {
            this.jobTitles = getObservable(params.jobTitles || []);
            this.selectJobTitle = params.selectJobTitle || function() {};
            this.showMarketplaceInfo = getObservable(params.showMarketplaceInfo || false);
        }
    });
    
    /// Stars
    ko.components.register('app-stars-rating', {
        template: { element: 'stars-rating-template' },
        viewModel: function(params) {
            this.rating = getObservable(params.rating || 2.5);
            this.total = getObservable(params.total || 0);
            this.size = getObservable(params.size || '');
            
            this.stars = ko.pureComputed(function() {
                var r = this.rating(),
                    list = [];
                for (var i = 1; i <= 5; i++) {
                    // TODO Support half values
                    list.push(i <= r ? 1 : 0);
                }
                return list;
            }, this);

            this.totalText = ko.pureComputed(function() {
                // TODO Conditional formatting for big numbers cases
                return '(' + this.total() + ')';
            }, this);
            
            this.classes = ko.pureComputed(function() {
                if (this.size()) return 'StarsRating--' + this.size();
                return '';
            }, this);
        }
    });
    
    /// ServiceProfessionalInfo
    var PublicUser = require('./models/PublicUser');
    ko.components.register('app-service-professional-info', {
        synchronous: true,
        template: { element: 'service-professional-info-template' },
        viewModel: {
            createViewModel: function(params) {
                var view = new PublicUser();
                if (params && params.api)
                    params.api(view);
                
                return view;
            }
        }
    });
    
    /// DatetimePicker
    var DateTimePickerVM = require('./viewmodels/DatetimePicker');
    ko.components.register('app-datetime-picker', {
        synchronous: true,
        template: { element: 'datetime-picker-template' },
        viewModel: {
            createViewModel: function(params, componentInfo) {
                var view = new DateTimePickerVM(app, componentInfo.element);
                if (params && params.api)
                    params.api(view);

                if (params)
                    Object.keys(params).forEach(function(key) {
                        if (ko.isObservable(view[key])) {
                            view[key](ko.unwrap(params[key]));
                            if (ko.isObservable(params[key]))
                                view[key].subscribe(params[key]);
                        }
                    });
                
                return view;
            }
        }
    });
};
