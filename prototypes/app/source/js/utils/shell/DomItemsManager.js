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

function DomItemsManager(settings) {

    this.idAttributeName = settings.idAttributeName || 'id';
    this.$root = $(settings.root || 'body');
    this.allowDuplicates = !!settings.allowDuplicates || false;
}

module.exports = DomItemsManager;

DomItemsManager.prototype.find = function find(containerName, root) {
    var $root = $(root || this.$root);
    // TODO escape name for CSS selector
    return $root.children('[' + this.idAttributeName + '=' + containerName + ']');
};

DomItemsManager.prototype.getActive = function getActive() {
    return this.$root.find('[' + this.idAttributeName + ']:visible');
};

DomItemsManager.prototype.inject = function inject(containerName, html) {

    // Creating a wrapper around the html
    // (can be provided the innerHtml or outerHtml, doesn't matters with next approach)
    var $html = $('<div/>', { html: html }),
        // We look for the container element (when the outerHtml is provided)
        $c = this.find(containerName, $html);

    if ($c.length === 0) {
        // Its innerHtml, so the wrapper becomes the container itself
        $c = $html.attr(this.idAttributeName, containerName);
    }

    if (!this.allowDuplicates) {
        // No more than one container instance can exists at the same time
        // We look for any existent one and its replaced with the new
        var $prev = this.find(containerName);
        $prev.replaceWith($c);
        $c = $prev;
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
    
    It's designed to be able to manage transitions, but this default
    implementation is as simple as 'show the new and hide the old'.
**/
DomItemsManager.prototype.switch = function switchActiveItem($from, $to, shell) {

    if (!$to.is(':visible')) {
        shell.emit(shell.events.willOpen, $to);
        $to.show();
        // Its enough visible and in DOM to perform initialization tasks
        // that may involve layout information
        shell.emit(shell.events.itemReady, $to);
        // When its completely opened
        shell.emit(shell.events.opened, $to);
    } else {
        // Its ready; maybe it was but sub-location
        // or state change need to be communicated
        shell.emit(shell.events.ready, $to);
    }

    if ($from.is(':visible')) {
        shell.emit(shell.events.willClose, $from);
        $from.hide();
        shell.emit(shell.events.closed, $from);
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
