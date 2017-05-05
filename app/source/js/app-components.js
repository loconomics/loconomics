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
    //jshint maxstatements:100

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

    /// inline-user-menu
    ko.components.register('app-inline-user-menu', {
        template: { element: 'inline-user-menu-template' },
        viewModel: { instance: app.navBarBinding }
    });

    ko.components.register('app-onboarding-menu', {
        template: { element: 'onboarding-menu-template' },
        viewModel: { instance: {} }
    });

    /// inline-side-menu
    ko.components.register('app-inline-side-menu', {
        template: { element: 'inline-side-menu-template' },
        viewModel: function(params) { //{ instance: app.navBarBinding }
            // create a viewModel that extends from the live instance of navBarBinding
            var vm = this;
            Object.keys(app.navBarBinding).forEach(function(prop) {
                vm[prop] = app.navBarBinding[prop];
            });

            // Additional specific properties
            vm.vocElement = getObservable(params.vocElement || 'general');
            vm.feedbackLink = ko.pureComputed(function() {
                return 'feedbackForm/' + this.vocElement();
            }, vm);
            vm.contactLink = ko.pureComputed(function() {
                return 'contactForm/' + this.vocElement();
            }, vm);

            // FAQs
            vm.helpLink = getObservable(params.helpLink || '');
            // List or objects { link: link, label: 'Index' }
            vm.items = ko.observableArray();
            var category2Item = function(a) {
                return {
                    label: a && a.name(),
                    link: a && a.urlPath()
                };
            };
            var section2Item = category2Item;
            var article2Item = function(a) {
                return {
                    label: a && a.title(),
                    link: a && a.urlPath()
                };
            };
            var idFromLink = function(link) {
                var result = /\/(\d+)/i.exec(link);
                return result && result[1] |0;
            };
            var types = {
                categories: function(link) {
                    var id = idFromLink(link);
                    if (id) {
                        // By ID
                        //return app.model.help.getCategory(id).then(category2Item);
                        return app.model.help.getSectionsByCategory(id).then(function(d) {
                            return d.map(section2Item);
                        });
                    }
                    else {
                        // All categories
                        return app.model.help.getCategories().then(function(d) {
                            return d.map(category2Item);
                        });
                    }
                },
                sections: function(link) {
                    var id = idFromLink(link);
                    if (id) {
                        // By ID
                        //return app.model.help.getSection(id).then(section2Item);
                        return app.model.help.getArticlesBySection(id).then(function(d) {
                            return d.map(article2Item);
                        });
                    }
                    else {
                        // All categories
                        return app.model.help.getSections().then(function(d) {
                            return d.map(section2Item);
                        });
                    }
                },
                articles: function(link) {
                    var id = idFromLink(link);
                    if (id) {
                        // By ID
                        return app.model.help.getArticle(id).then(article2Item);
                    }
                    else {
                        // All categories
                        return app.model.help.getArticles().then(function(d) {
                            return d.map(article2Item);
                        });
                    }
                }
            };
            // There is an especial view at 'help' activity for 'relatedArticles' type, but
            // internally loads the same data as 'sections' and the provided ID is a sectionID
            // so just make an alias to recognize the links
            types.relatedArticles = types.sections;

            ko.computed(function() {
                var link = this.helpLink();
                if (link) {
                    var type;
                    Object.keys(types).some(function(t) {
                        if (link.indexOf(t) > -1) {
                            type = t;
                            return true;
                        }
                    });
                    if (type) {
                        types[type](link).then(function(list) {
                            // Supports null/undefined, single items and lists at 'list'
                            vm.items(list ? Array.isArray(list) ? list : [list] : []);
                        });
                    }
                    else {
                        // Not recognized link
                        console.warn('Help Link not recognized', link);
                        vm.items([]);
                        return;
                    }
                } else {
                    vm.items([]);
                }
            }, vm);
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
            this.allJobTitles = getObservable(params.jobTitles || []);
            // Filtered list, without records 'being deleted'
            this.jobTitles = ko.pureComputed(function() {
                return this().filter(function(j) {
                    return !j.isBeingDeleted();
                });
            }, this.allJobTitles);
            this.selectJobTitle = params.selectJobTitle || function() {};
            this.showMarketplaceInfo = getObservable(params.showMarketplaceInfo || false);
        }
    });

    /// Stars
    ko.components.register('app-stars-rating', {
        template: { element: 'stars-rating-template' },
        viewModel: function(params) {
            this.rating = getObservable(params.rating || 0);
            this.total = getObservable(params.total || 0);
            this.size = getObservable(params.size || '');

            // Example: rating=3.6, starPosition=1 (or 2, 3, 4, 5)
            function computeStarValue(rating, starPosition) {
                var x = (rating / starPosition) |0;
                var z = rating % 1;
                if (x > 0) {
                    return 1;
                }
                else if ((rating |0) === (starPosition - 1) && z !== 0) {
                    if (z >= 0.5)
                        return 0.5;
                    else
                        return 0;
                }
                else {
                    return 0;
                }
            }

            this.stars = ko.pureComputed(function() {
                var r = this.rating(),
                    list = [];
                for (var i = 1; i <= 5; i++) {
                    list.push(computeStarValue(r, i));
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

    /// AddressMap
    var googleMapReady = require('./utils/googleMapReady');
    var i18n = require('./utils/i18n');
    ko.components.register('app-address-map', {
        synchronous: true,
        template: '<div></div>',
        viewModel: {
            createViewModel: function(params, componentInfo) {
                var v = {
                    lat: ko.unwrap(params.lat),
                    lng: ko.unwrap(params.lng),
                    zoom: ko.unwrap(params.zoom) || 11,
                    radius: ko.unwrap(params.radius) |0,
                    isServiceLocation: ko.unwrap(params.isServiceLocation) || false,
                    radiusMeters: 0,
                    refreshTs: getObservable(params.refreshTs),
                    map: null,
                    circle: null
                };
                v.circleColor = v.isServiceLocation ? '#5F2393' : '#00989A';

                var c = i18n.getCurrentCulture();
                var unit = i18n.distanceUnits[c.country];
                if (v.isServiceLocation || !v.radius) {
                    // Default for service locations (they have not radius)
                    v.radius = 0.5;
                    unit = 'miles';
                }

                // Prepare radius in meters
                v.radiusMeters = i18n.convertMilesKm(v.radius, unit) * 1000;

                googleMapReady(function(google) {
                    // Avoid put the map in the limits (array with top-left lat-lng, bottom-right lat-lng):
                    var mapLimits = [ 70, -168, 14, -63 ]; // USA limits
                    if (v.lat > mapLimits[0]) v.lat = mapLimits[0];
                    else if (v.lat < mapLimits[2]) v.lat = mapLimits[0];
                    if (v.lng < mapLimits[1]) v.lng = mapLimits[1];
                    else if (v.lng > mapLimits[3]) v.lng = mapLimits[3];

                    var myLatlng = new google.maps.LatLng(v.lat, v.lng);

                    // Create map
                    var mapOptions = {
                        zoom: v.zoom,
                        center: myLatlng,
                        mapTypeId: google.maps.MapTypeId.ROADMAP
                    };
                    v.map = new google.maps.Map(componentInfo.element.children[0], mapOptions);
                    v.circle = new google.maps.Circle({
                        center: myLatlng,
                        map: v.map,
                        clickable: false,
                        radius: v.radiusMeters,
                        fillColor: v.circleColor,
                        fillOpacity: 0.3,
                        strokeWeight: 0
                    });

                    // on visibility or size Google Maps requires a refresh to don't get buggy:
                    var refresh = googleMapReady.refreshMap.bind(null, v.map);
                    v.refreshTs.subscribe(refresh);
                    // Next disabled to allow activities to have the responsability
                    // of take care of that only when thay are visible (updating refreshTs),
                    // to don't waste cycles
                    //$(window).on('layoutUpdate', refresh);
                });
                return v;
            }
        }
    });

    // Onboarding
    var OnboardingProgressMarkVM = require('./viewmodels/OnboardingProgressMarkVM');
    ko.components.register('app-onboarding-progress-mark', {
        template: { element: 'onboarding-progress-mark-template' },
        viewModel: { createViewModel: function() { return new OnboardingProgressMarkVM(app); } }
    });
    var OnboardingProgressBarVM = require('./viewmodels/OnboardingProgressBarVM');
    ko.components.register('app-onboarding-progress-bar', {
        template: { element: 'onboarding-progress-bar-template' },
        viewModel: { createViewModel: function() { return new OnboardingProgressBarVM(app); } }
    });

    /// search components
    var SearchJobTitlesVM = require('./viewmodels/SearchJobTitlesVM');
    ko.components.register('app-search-job-titles', {
        template: { element: 'search-job-titles-template' },
        // TODO Try with synchronous option to enable use of this component ( now used viewmodel and template directly)
        //synchronous: true,
        // TODO Implement geolocate code of learnMoreProfessionals as part of the component
        viewModel: {
            createViewModel: function(params/*, componentInfo*/) {
                var view = new SearchJobTitlesVM(app);
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

    /**
     * A dictionary of job titles with the name to display
     * as a key and the jobTitleID as the value.
     * @typedef InvertedJobTitlesDictionary
     */
    /**
     * Ko component 'select-job-title' to display a concrete
     * list of job titles and pick one.
     * @param {object} params
     * @param {KnockoutObservable<number>} params.selected Get or set
     * the selected job title by ID, if available in the list
     * @param {InvertedJobTitlesDictionary} [params.jobTitles] Dictionary of job
     * titles available for selection
     * @param {string|KnockoutObservable<string>} [params.caption] Text before
     * select any option; equivalent to set a null ID.
     *
     * Allowed children:
     * item: [list]
     *  - {number} id attribute, the jobTitleID
     *  - {string} content, the job title display name
     */
    ko.components.register('app-select-job-title', {
        template: { element: 'select-job-title-template' },
        synchronous: true,
        viewModel: {
            createViewModel: function(params, componentInfo) {

                var vm = {
                    selected: ko.observable(null),
                    list: ko.observableArray([]),
                    caption: getObservable(params.caption)
                };

                if (params && ko.isWritableObservable(params.selected)) {
                    // two-way updates
                    vm.selected.subscribe(params.selected);
                    params.selected.subscribe(vm.selected);
                }

                if (params && params.jobTitles) {
                    var l = Object.keys(params.jobTitles)
                    .map(function (key) {
                        return {
                            id: params.jobTitles[key],
                            name: key
                        };
                    });
                    vm.list(l);
                }
                else {
                    // Read static 'item' children at the markup
                    componentInfo.templateNodes.forEach(function(node) {
                        // 'item' supported
                        if (node.tagName && node.tagName.toLowerCase() === 'item') {
                            // An integer jobTitleID
                            var id = node.getAttribute('id') |0;
                            // The job title display name
                            var name = node.textContent;
                            vm.list.push({
                                id: id,
                                name: name
                            });
                        }
                    });
                }

                return vm;
            }
        }
    });

    /**
     * KO component 'signup' that implements the sign-up form
     *
     * @param {object} params Can include any value of the SignupVM, to
     * set-up the instance and keep updated from internal changes,
     * a couple of examples:
     * @param {bool} [params.isCountryVisible]
     * @param {string} [params.profile]
     * @param {KnockoutObservable<SignupVM>} [params.api] Allow to provide an empty
     * observable that will be initialized with the component instance
     * view model
     * @param {function} [params.onSignedUp] Handler to be executed when the
     * signedup event gets emitted
     * @param {function} [params.onSignUpError] Handler to be executed when the
     * signuperror event gets emitted
     *
     * Allowed children:
     * h5.SignupLogin-prompt: [single]
     * - {string} content Text to display before the job titles list
     * select-job-title: [single]
     * - {KnockoutObservable<number>} selected Must be set to jobTitleID in order
     * to work connected with the signup form.
     */
    var SignupVM = require('./viewmodels/Signup');
    ko.components.register('app-signup', {
        template: { element: 'signup-template' },
        synchronous: true,
        viewModel: {
            createViewModel: function(params, componentInfo) {
                var vm = new SignupVM(app);
                // Let expose the whole viewmodel as the component API
                if (ko.isWritableObservable(params.api)) {
                    params.api(vm);
                }
                // Let access to set from params every writable
                // observable in the Signup viewmodel
                Object.keys(params).forEach(function(key) {
                    if (ko.isWritableObservable(vm[key])) {
                        vm[key](ko.unwrap(params[key]));
                        // Keep original parameter notified of change
                        if (ko.isObservable(params[key])) {
                            vm[key].subscribe(params[key]);
                        }
                    }
                });
                // Let set a handler for each event emitted
                if (typeof (params.onSignedUp) == 'function') {
                    vm.on('signedup', function(signedupData) {
                        params.onSignedUp.call(vm, signedupData);
                    });
                }
                if (typeof (params.onSignUpError) == 'function') {
                    vm.on('signuperror', function(error) {
                        params.onSignUpError.call(vm, error);
                    });
                }
                // We have a new special setting, setting visualization
                // of the language that join job titles list and the
                // form/buttons.
                vm.isThenLabelDisplayed = ko.observable(false);
                // We detect if there are children elements, that means
                // we need to display the label
                if (componentInfo.templateNodes.length) {
                    vm.isThenLabelDisplayed(true);
                }

                return vm;
            }
        }
    });
};
