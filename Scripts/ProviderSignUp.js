/****************************
 * ProviderSignUp page script
 */
$(function () {
    // Autocomplete positions and add to the list
    var positionsList = null, tpl = null;
    $('#providersignup-position-search').autocomplete({
        source: UrlUtil.JsonPath + 'GetPositions/Autocomplete/',
        autoFocus: true,
        select: function (event, ui) {
            var c = $(this).closest('.positions');
            positionsList = positionsList || c.find('.positions-list > ul');
            tpl = tpl || positionsList.children('.template:eq(0)');
            // No value, no action :(
            if (!ui || !ui.item || !ui.item.value) return;

            // Add if not exists in the list
            if (positionsList.children().filter(function () {
                return $(this).data('position-id') == ui.item.value;
            }).length == 0) {
                // Create item from template:
                positionsList.append(tpl.clone()
                    .removeClass('template')
                    .data('position-id', ui.item.value)
                    .children('.name').text(ui.item.label)
                    .end().children('[name=position]').val(ui.item.value)
                    .end());
            }

            c.find('.position-description > textarea').val(ui.item.description);

            // We want show the label (position name) in the textbox, not the id-value
            $(this).val(ui.item.label);
            return false;
        },
        focus: function (event, ui) {
            if (!ui || !ui.item || !ui.item.label);
            // We want the label in textbox, not the value
            $(this).val(ui.item.label);
            return false;
        }
    });
    // Remove positions from the list
    $('.provider-sign-up .positions-list > ul').on('click', 'li > a', function () {
        var $t = $(this);
        if ($t.attr('href') == '#remove-position') {
            // Remove complete element from the list (label and hidden form value)
            $t.parent().remove();
        }
    });
});