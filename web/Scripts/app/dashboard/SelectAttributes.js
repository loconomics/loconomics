/**
    Class to manage the selection of attributes, mainly from an 
    autocomplete to a list of attributes with removal button
    and tooltip/popover for extended description.
    
    Created to enhance and simplife the service-attributes interface
    on dashboard.
**/
function SelectAttributes($c, categoryId) {

    this.$c = $c.addClass('SelectAttributes');
    this.$sel = $c.find('.SelectAttributes-selection');
    this.categoryId = categoryId;
    // Cache list of selected IDs
    this.selected = [];
    // Cache object of new attributes selected
    // (using an object without prototype because of 
    // the better performance look-up, and we maintain
    // a reference to the whole object too)
    this.news = {};
    this.news.prototype = null;

    this.hasId = function hasId(attId) {
        return this.selected.indexOf(attId) !== -1;
    };

    this.addId = function addId(attId) {
        this.selected.push(attId);
    };

    this.removeId = function removeId(attId) {

        // Remove from selected ones
        var i = this.selected.indexOf(parseInt(attId, 10));
        if (i > -1) {
            delete this.selected[i];
        }
    };

    this.removeNew = function removeNew(attName) {
        // Remove from news
        delete this.news[attName];
    };

    /**
        Check if the given item exists in the 
        selection, either an ID or a new
        attribute name
    **/
    this.has = function has(item) {
        return (
            this.hasId(item.ServiceAttributeID) ||
            (item.ServiceAttribute in this.news)
        );
    };

    this.remove = function remove(el, silentChange) {

        var $el = $(el),
            check = $el.siblings('[type=checkbox]'),
            parent = $el.closest('li'),
            val = check.val();

        if (!silentChange)
            // notify form change
            check.change();

        // Is an ID (integer) or new name?
        if (/^\d+$/.test(val)) {
            // Remove from Id
            this.removeId(val);
        } else {
            // Remove from New
            this.removeNew(val);
        }

        parent.remove();
    };

    this.add = function add(item, silentChange) {

        // Check if is not in the list already
        if (this.has(item))
            return false;

        // Add to selected cache
        if (item.ServiceAttributeID)
            this.addId(item.ServiceAttributeID);

        var li = $('<li class="SelectAttributes-item"/>').appendTo(this.$sel);
        var link = $('<span class="SelectAttributes-item-name"/>')
        .text(item.ServiceAttribute)
        .appendTo(li)
        .popover({
            content: item.ServiceAttributeDescription,
            trigger: 'hover',
            container: 'body'
        });

        var $check = $('<input type="checkbox" style="display:none" checked="checked" />')
        .attr('name', 'positionservices-category[' + item.ServiceAttributeCategoryID + ']-attribute[' + item.ServiceAttributeID + ']')
        .attr('value', item.ServiceAttributeID || item.ServiceAttribute)
        .appendTo(li);

        if (!silentChange)
            // notify form change:
            $check.change();

        $('<a href="#" class="SelectAttributes-item-remove">X</a>')
        .appendTo(li);

        return true;
    };

    this.addNew = function addNew(newAttribute) {

        if (typeof (newAttribute) === 'string') {
            // Avoid empty or whitespace names
            if (!newAttribute || /^\s+$/.test(newAttribute))
                return false;

            var createFromName = true;

            // Search if exists on the source list:
            if (typeof (this.autocompleteSearch) === 'function') {
                // Use autocompleteSearch to look for an exact match in
                // the source list, avoiding attempts to add new attributes
                // that already exists in the source and has an ID
                var foundItems = this.autocompleteSearch(newAttribute);
                if (foundItems && foundItems.length) {
                    // Get the first found (ideally it must be the only one)
                    newAttribute = foundItems[0];
                    // Use this rather than create one
                    createFromName = false;
                }
            }

            if (createFromName) {
                newAttribute = {
                    ServiceAttribute: newAttribute,
                    ServiceAttributeID: 0,
                    ServiceAttributeDescription: null,
                    ServiceAttributeCategoryID: this.categoryId,
                    UserChecked: true
                };
            }
        }

        // Add UI element
        var wasAdded = this.add(newAttribute);

        // If it was added and is a new attribute (ID=0)
        if (wasAdded && newAttribute.ServiceAttributeID === 0) {
            // Add to cache:
            this.news[newAttribute.ServiceAttribute] = newAttribute;
        }

        return wasAdded;
    };

    // Handlers
    var selectAtts = this;

    $c.on('click', '.SelectAttributes-item-remove', function () {
        selectAtts.remove(this);
        return false;
    });
}

module.exports = SelectAttributes;

SelectAttributes.prototype.fillWithCheckedAttributes = function fillWithCheckedAttributes(attributes) {
    var self = this;
    attributes.filter(function (att) {
        return att && att.UserChecked;
    }).forEach(function (item) {
        self.add(item, true);
    });
};

SelectAttributes.prototype.setupAutocomplete = function setupAutocomplete(list) {

    this.$autocomplete = this.$c.find('.SelectAttributes-autocomplete');
    this.$acButton = this.$autocomplete.find('.SelectAttributes-autocompleteButton');
    this.$acInput = this.$autocomplete.find('.SelectAttributes-autocompleteInput');
    this.autocompleteSource = list;

    // Reference to 'this' for the following closures
    var selectAtts = this;

    /**
    Performs a search by name on the autocomplete source list
    using the given exact, case insensitive, name or a regular expression.
    **/
    this.autocompleteSearch = function (nameOrMatcher) {

        var matcher = nameOrMatcher;
        if (typeof (nameOrMatcher) === 'string') {
            matcher = new RegExp('^' + $.ui.autocomplete.escapeRegex(nameOrMatcher) + '$', 'i');
        }

        return $.grep(this.autocompleteSource, function (value) {
            // Only those not selected still
            if (selectAtts.has(value)) {
                return false;
            }
            // Search by name:
            // (replaced non-breaking space by a normal one)
            value.value = value.ServiceAttribute.replace(/\u00a0/g, ' ');
            var found = matcher.test(value.value);
            // Result
            return found;
        });
    };

    // Autocomplete set-up
    this.$acInput.autocomplete({
        source: function (request, response) {
            // Partial string search
            var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), 'i');
            response(selectAtts.autocompleteSearch(matcher));
        },
        select: function (event, ui) {

            selectAtts.add(ui.item);

            selectAtts.$acInput
            // Clean-up value
            .val('');
            // Force show list again,
            // the 'inmediate delay' is because
            // this handler is followed by
            // a 'close autocomplete' action,
            // we need open it after that
            setTimeout(function () {
                selectAtts.$acInput.trigger('selectattributesshowlist');
            }, 1);

            return false;
        },
        // To allow show all elements:
        minLength: 0
    });

    function _performAddNew() {
        selectAtts.addNew(selectAtts.$acInput.val());

        selectAtts.$acInput
        // Clean-up value
        .val('')
        // Force show list again
        .trigger('selectattributesshowlist');
    }

    // Press Enter on autocomplete textbox:
    // - to avoid unwanted form-submit
    // - to trigger the addnew action
    this.$acInput.on('keypress', function (e) {
        if (e.keyCode == 13) {
            // addnew
            _performAddNew();
            // Cancel form-submit:
            return false;
        }
    });

    // Button handler
    selectAtts.$c.on('click', '.SelectAttributes-autocompleteButton', function () {
        _performAddNew();
    });

    // Show full list on focus/hovering
    this.$acInput.on('focus selectattributesshowlist', function () {
        if (!selectAtts.$acInput.autocomplete('widget').is(':visible'))
            selectAtts.$acInput.autocomplete('search', '');
    });
};
