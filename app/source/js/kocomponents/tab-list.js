/**
 * @module kocomponents/tab-list
 * @author iagosrl
 * @overview Wraps a list of links that are enabled as tabs for the linked
 * in-page elements. The content of the component is the children provided
 * 'as is'.
 * The active tab and panel will have
 */
'use strict';

var TAG_NAME = 'tab-list';
var TEMPLATE = require('../../html/kocomponents/tab-list.html');
var ACTIVE_TAB_CLASS = 'active';

var ko = require('knockout');
var getObservable = require('../utils/getObservable');
var $ = require('jquery');

/**
 * The component view model
 * @class
 * @param {Object} params
 * @param {string} [prefix]
 * @param {KnockoutObservable<string>} [active]
 */
function ViewModel(params) {
    /**
     * @member {string} prefix The prefix that each link has. Used both to filter
     * which links are enabled as tabs and to provide a shortest name for each
     * tab (prefix is removed from the link and the rest is the name)
     */
    this.prefix = ko.unwrap(params.prefix) || '';
    /**
     * @member {KnockoutObservable<string>} active Keep record of the active
     * tab name and allows to bet read or written from outside.
     */
    this.active = getObservable(params.active);
}

/**
 * Factory for the component view model instances that has access
 * to the component instance DOM elements.
 * @param {object} params Component parameters to pass it to ViewModel
 * @param {object} componentInfo Instance DOM elements
 * @param {HTMLElement} componentInfo.element the component element
 * @param {Array<HTMLElement>} componentInfo.templateNodes elements passed in
 * to the component by place them as children.
 */
var create = function(params, componentInfo) {
    var vm = new ViewModel(params);
    var $root = $(componentInfo.element);

    /**
     * @overview Set-up children elements, external linked panels, event
     * handlers and 'active tab' detection.
     * This all requires to have access to the children elements rendered that
     * means cannot be done right at the constructor (at 'create') but just
     * once time after the component and it's children elements are 'rendered'
     * (created on the DOM).
     * @private
     */
    vm.afterRender = function() {
        var $tabLinks = $root
        .find('a[href^="' + vm.prefix + '"]');
        // Set-up ARIA attributes
        $root.attr('role', 'tablist');
        // Set-up each link
        $tabLinks
        .attr('role', 'tab')
        .attr('tabindex', '-1')
        .each(function(i, tabLink) {
            tabLink = $(tabLink);
            var link = tabLink.attr('href');
            var id = link.replace(/^#/, '');
            tabLink.attr('aria-controls', id);
            // Set-up panel
            $(link).attr('role', 'tabpanel');
        });
        // Catch link clicks and set active tab
        var setElementAsActive = function(tabElement, e) {
            var link = $(tabElement).attr('href');
            var isPrefix = link.indexOf(vm.prefix) === 0;
            if (isPrefix) {
                // Save which one is active
                var tabName = isPrefix ? link.replace(vm.prefix, '') : link;
                vm.active(tabName);
                if (e) {
                    // Avoid standard behavior
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            }
        };
        $root.on('click', 'a[href]', function(e) {
            setElementAsActive(this, e);
        });
        // Switch active tab on change
        var updateActive = function(tabName) {
            if(!tabName) return;
            // Get fragment URL
            var url = vm.prefix + tabName;
            if (!/^#/.test(url)) {
                url = '#' + url;
            }
            // Get new elements
            var tab = $root.find('[href="' + url + '"]');
            var panel = $(url);
            if (tab.length) {
                // Previous tab is disabled an new one make active, touching tab
                // and panel; when tab/link is part of list, is useful to mark the
                // container list-item too

                // Disable previous one
                var prevTab = $tabLinks
                .filter('.' + ACTIVE_TAB_CLASS)
                .removeClass(ACTIVE_TAB_CLASS)
                .attr('aria-selected', null)
                .attr('tabindex', '-1');
                prevTab.parent('li')
                .removeClass(ACTIVE_TAB_CLASS);
                var prevUrl = prevTab.attr('href');
                if (prevUrl) {
                    $(prevUrl)
                    .removeClass(ACTIVE_TAB_CLASS)
                    .attr('aria-selected', null)
                    .hide();
                }
                // Enable new ones
                tab
                .addClass(ACTIVE_TAB_CLASS)
                .attr('aria-selected', 'true')
                .attr('tabindex', '0');
                tab.parent('li')
                .addClass(ACTIVE_TAB_CLASS);
                panel
                .addClass(ACTIVE_TAB_CLASS)
                .attr('aria-selected', 'true')
                .show();
            }
        };
        ko.computed(function() {
            updateActive(vm.active());
        });

        // Keyboard management
        var goTabIndexOffset = function(indexOffset) {
            var active = $tabLinks.filter('.' + ACTIVE_TAB_CLASS);
            var index = $tabLinks.index(active);
            var last = $tabLinks.length - 1;
            index += indexOffset;
            if (index < 0) {
                index = last;
            }
            else if (index > last) {
                index = 0;
            }
            var newTab = $tabLinks.eq(index);
            setElementAsActive(newTab);
            newTab.focus();
        };
        var goPrevious = function() {
            goTabIndexOffset(-1);
        };
        var goNext = function() {
            goTabIndexOffset(1);
        };
        // Arrow keys must move between tabs
        var LEFT_KEY = 37;
        var RIGHT_KEY = 39;
        $root.on('keydown', function(e) {
            switch (e.which) {
                case LEFT_KEY:
                    goPrevious();
                    break;
                case RIGHT_KEY:
                    goNext();
                    break;
            }
        });
    };

    // Ready
    return vm;
};

ko.components.register(TAG_NAME, {
    template: TEMPLATE,
    viewModel: { createViewModel: create },
    synchronous: true
});
