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

DomItemsManager.prototype.getCurrent = function getCurrent() {
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
