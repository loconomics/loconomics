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
    this.news = [];
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

    /**
        Check if the given item exists in the 
        selection, either an ID or a new
        attribute name
    **/
    this.has = function has(item) {
        return (
            this.hasId(item.ServiceAttributeID) ||
            item.ServiceAttribute in this.news
        );
    };

    this.remove = function remove(el) {

        var $el = $(el),
                check = $el.siblings('[type=checkbox]'),
                parent = $el.closest('li'),
                val = check.val();

        this.removeId(val);

        parent.remove();
    };

    this.add = function add(item) {

        // Add to selected cache
        if (item.ServiceAttributeID)
            this.addId(item.ServiceAttributeID);

        var li = $('<li/>').appendTo(this.$sel);
        var link = $('<span/>')
                .text(item.ServiceAttribute)
                .appendTo(li)
                .popover({
                    content: item.ServiceAttributeDescription,
                    trigger: 'hover',
                    container: 'body'
                });

        $('<input type="checkbox" style="display:none" checked="checked" />')
                .attr('name', 'positionservices-category[' + item.ServiceAttributeCategoryID + ']-attribute[' + item.ServiceAttributeID + ']')
                .attr('value', item.ServiceAttributeID || item.ServiceAttribute)
                .appendTo(li);

        $('<a href="#" class="remove-action">X</a>')
                .appendTo(li);
    };

    this.addNew = function addNew(newAttribute) {

        if (typeof (newAttribute) === 'string') {
            newAttribute = {
                ServiceAttribute: newAttribute,
                ServiceAttributeID: 0,
                ServiceAttributeDescription: null,
                ServiceAttributeCategoryID: this.categoryId,
                UserChecked: true
            };
        }

        // Add to cache:
        this.news[newAttribute.ServiceAttribute] = newAttribute;

        // Add UI element
        this.add(newAttribute);
    };

    // Handlers
    var selectAtts = this;

    $c.on('click', '.remove-action', function () {
        selectAtts.remove(this);
    });
}

module.exports = SelectAttributes;

SelectAttributes.prototype.fillWithCheckedAttributes = function fillWithCheckedAttributes(attributes) {

    attributes.filter(function (att) {
        return att && att.UserChecked;
    }).forEach(this.add.bind(this));
};

SelectAttributes.prototype.setupAutocomplete = function setupAutocomplete(list) {

    this.$autocomplete = this.$c.find('.SelectAttributes-autocomplete');
    this.$acButton = this.$autocomplete.find('.SelectAttributes-autocompleteButton');
    var $el = this.$acInput = this.$autocomplete.find('.SelectAttributes-autocompleteInput');
    this.autocompleteSource = list;

    // Reference to 'this' for the following closures
    var selectAtts = this;

    // Autocomplete set-up
    $el.autocomplete({
        source: function (request, response) {

            var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");

            response($.grep(list, function (value) {
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
            }));
        },
        select: function (event, ui) {

            selectAtts.add(ui.item);

            // Clear box:
            $el.val('');
            return false;
        }
    });

    // Button handler
    selectAtts.$c.on('click', '.addnew-action', function () {
        selectAtts.addNew(selectAtts.$acInput.val());
        selectAtts.$acInput.val('');
    });
};
