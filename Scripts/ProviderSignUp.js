/****************************
 * ProviderSignUp page script
 */
var ProviderSignUp = {
    init: function () {
        // Template position item value must be reset on init (because some form-recovering browser features that put on it bad values)
        $('.positions .positions-list > ul > li.template > [name=position]').val('');
        // Autocomplete positions and add to the list
        var positionsList = null, tpl = null;
        var positionsAutocomplete = $('#providersignup-position-search').autocomplete({
            source: UrlUtil.JsonPath + 'GetPositions/Autocomplete/',
            autoFocus: false,
            minLength: 0,
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
        // Load all positions in background to replace the autocomplete source (avoiding multiple, slow look-ups)
        $.getJSON(UrlUtil.JsonPath + 'GetPositions/Autocomplete/',
            function (data) {
                positionsAutocomplete.autocomplete('option', 'source', data);
            }
        );
        // Show autocomplete on 'plus' button
        $('.select-position .add-action').click(function () {
            positionsAutocomplete.autocomplete('search', '');
            return false;
        });
        // Remove positions from the list
        $('.positions-list > ul').on('click', 'li > a', function () {
            var $t = $(this);
            if ($t.attr('href') == '#remove-position') {
                // Remove complete element from the list (label and hidden form value)
                $t.parent().remove();
            }
            return false;
        });

        // custom client-side validation for agree termsofuse
        (function () {
            var f = $('#provider-sign-up-create-a-login');
            f.data('customValidation', {
                form: f,
                validate: function () {
                    // Validate terms of use
                    var agree = this.form.find('[name=termsofuse]');
                    var ok = agree.is(':checked');
                    // summary errors, remove previous errors
                    var sum = this.form.find('.validation-summary-errors, .validation-summary-valid');
                    sum.children('ul').children().remove();
                    if (!ok) {
                        (function (f) {
                            var errmsg = agree.data('customval-requirechecked');
                            sum.removeClass('validation-summary-valid').addClass('validation-summary-errors');
                            // Add if not exist (to avoid repeat it)
                            if (sum.find('>ul>li').filter(function () { return (errmsg == $(this).text()) }).length == 0)
                                sum.children('ul').append('<li>' + errmsg + '</li>');
                            agree.addClass('input-validation-error');
                            f.find('[data-valmsg-for=termsofuse]').text(errmsg).show().addClass('field-validation-error');
                        })(this.form);
                    }
                    // Validate positions (is required almost one)
                    var positions = this.form.find('[name=position]');
                    if (positions.length == 1) {
                        ok = false;
                        (function (f) {
                            var errmsg = f.find('.lc-ressources > .positions-required').text();
                            sum.removeClass('validation-summary-valid').addClass('validation-summary-errors');
                            if (sum.find('>ul>li').filter(function () { return (errmsg == $(this).text()) }).length == 0)
                                sum.children('ul').append('<li>' + errmsg + '</li>');
                        })(this.form);
                    }
                    // Return global result
                    return ok;
                }
            });
        })();
    }
};
$(ProviderSignUp.init);