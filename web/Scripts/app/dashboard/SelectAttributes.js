/**
    Class to manage the selection of attributes, mainly from an 
    autocomplete to a list of attributes with removal button
    and tooltip/popover for extended description.
    
    Created to enhance and simplife the service-attributes interface
    on dashboard.
**/
function SelectAttributes($c) {

    this.$c = $c.addClass('SelectAttributes');
    this.$sel = $c.find('.SelectAttributes-selection');
    this.selected = [];

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
                .attr('value', item.ServiceAttributeID)
                .appendTo(li);

        $('<a href="#" class="remove-action">X</a>')
                .appendTo(li);
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
    var selectedAtts = this;

    // Autocomplete set-up
    $el.autocomplete({
        source: function (request, response) {

            var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");

            response($.grep(list, function (value) {
                // Only those not selected still
                if (selectedAtts.hasId(value.ServiceAttributeID)) {
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

            selectedAtts.add(ui.item);

            // Clear box:
            $el.val('');
            return false;
        }
    });
};
