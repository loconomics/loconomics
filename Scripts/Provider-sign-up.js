// public functions:
var public = {
    loadPositions: function(){}
};

function initYourWork(){
    /* ============
    *  Your Work
    */
    var jSelectPosition = $('select[name=select-position]');
    var jAttributes = $('.select-attributes');
    var jActions = $('.your-work fieldset.actions');
    $.blockUI.defaults.message = null;

    var loadPositions = public.loadPositions = function loadPositions() {
        // Lock element:
        jSelectPosition.parent().block(loadingBlock);

        // Reset positions, except first/value empty
        if (jSelectPosition.get(0).options.length > 1)
            jSelectPosition.find("option:not([value=''])").remove();

        /* Template to create a select option
        {0}: positionId
        {1}: position singular name
        */
        var tplOption = '<option value="{0}">{1}</option>';

        // Call ajax
        $.ajax({
            url: UrlUtil.JsonPath + "GetPositions/",
            dataType: 'json',
            success: function (data, textStatus, jqXHR) {
                // Check result
                if (data.Code == -1) {
                    jSelectPosition.parent().unblock().block(errorBlock(data.Result.ErrorMessage, 'public.loadPositions()'));
                    return;
                }

                // Iterate categories
                $.each(data.Result.Positions, function (iPos, pos) {
                    // Create and add the new option
                    jSelectPosition.append(tplOption
                        .replace('{0}', pos.PositionID)
                        .replace('{1}', pos.PositionSingular));
                });

                jSelectPosition.parent().unblock();
            },
            error: function (jqXHR, errorText) {
                jSelectPosition.parent().unblock().block(errorBlock(null, 'public.loadPositions()'));
            }
        });
    }

    function loadAttributes() {

        var selectedPosition = $(this).val();

        // No position:
        if (!selectedPosition) {
            jAttributes.block({ overlayCSS: { cursor: 'default'} });
            jActions.block({ overlayCSS: { cursor: 'default'} });
            return;
        }
        // Get all fieldsets and fieldset containers container
        var catscontainer = $('.select-attributes');
        // Get dynamic fieldsets container:
        var fscontainer = $('.service-attribute-categories');

        /* Template to create a fieldset for attribute-category 
        @0 CategoryId
        @1 CategoryName
        @2 CategoryDescription
        */
        var tplCategory = '<fieldset class="service-attribute-category" id="service-attribute-category-@0"><legend title="@1" data-description="@2">@1:</legend></fieldset>';
        /* Template to create a label with checkbox, markers:
        @0 CategoryId
        @1 AttributeId
        @2 AttributeName
        @3 AttributeDescription
        */
        var tplAttCheck = '<label title="@2" data-description="@3"><input name="positionservices-category[@0]-attribute[@1]" type="checkbox" value="@1"/><span>@2</span></label>';
        /* Template to create a select for attributes options, markers:
        @0 CategoryId
        @1 CategoryName
        @2 CategoryDescription
        */
        var tplAttSelect = '<select name="positionservices-category[@0]" title="@1" data-description="@2"></select>';
        /* Template to create the select options for attributes, markers:
        @0 AttributeID
        @1 AttributeName
        @2 AttributeDescription
        */
        var tplAttSelectOpt = '<option title="@1" data-description="@2" value="@0">@1</option>';

        function createAttCheckList(cat, checkSelectCat) {
            var c = $('<ul></ul>');
            // Iterate category attributes
            $.each(cat.ServiceAttributes, function (iAtt, att) {
                var hAtt = tplAttCheck
                    .replace(/@0/g, cat.ServiceAttributeCategoryID)
                    .replace(/@1/g, att.ServiceAttributeID)
                    .replace(/@2/g, att.ServiceAttribute)
                    .replace(/@3/g, att.ServiceAttributeDescription);

                // Add new attribute html
                c.append('<li>' + hAtt + 
                    (checkSelectCat ? createAttSelect(checkSelectCat) : '') + 
                    '</li>');
            });
            return c;
        }
        function createAttSelect(cat) {
            var c = $(tplAttSelect
                .replace(/@0/g, cat.ServiceAttributeCategoryID)
                .replace(/@1/g, cat.ServiceAttributeCategoryName)
                .replace(/@2/g, cat.ServiceAttributeCategoryDescription));
            $.each(cat.ServiceAttributes, function (iAtt, att) {
                c.append(tplAttSelectOpt
                    .replace(/@0/g, att.ServiceAttributeID)
                    .replace(/@1/g, att.ServiceAttribute)
                    .replace(/@2/g, att.ServiceAttributeDescription));
            });
            return c;
        }

        // Locking elements and showing loading message
        jAttributes.block(loadingBlock);
        jActions.block();

        // Do the ajax to load attributes
        $.ajax({
            url: UrlUtil.JsonPath + 'GetServiceAttributes/',
            data: { positionId: selectedPosition, filter: 'provider-services' },
            dataType: 'json',
            success: function (data, textStatus, jqXHR) {

                // Check result
                if (data.Code == -1) {
                    jAttributes.unblock().block(errorBlock(data.Result.ErrorMessage));
                    return;
                }

                // First, hide all fieldset (not all will be needed)
                catscontainer.find('fieldset').hide();

                // Iterate categories
                $.each(data.Result.ServiceAttributeCategories, function (iCat, cat) {
                    // Locate the category fieldset
                    var fs = $('#service-attribute-category-' + cat.ServiceAttributeCategoryID);

                    // Only if there are attributes on the category, else break into next
                    if (!cat.ServiceAttributes || cat.ServiceAttributes.length == 0)
                        return; // break each

                    // If category fieldset doesn't exist, create it:
                    if (fs.length == 0) {
                        var fs = $(tplCategory
                            .replace(/@0/g, cat.ServiceAttributeCategoryID)
                            .replace(/@1/g, cat.ServiceAttributeCategoryName)
                            .replace(/@2/g, cat.ServiceAttributeCategoryDescription));
                        fscontainer.append(fs);
                    }

                    // Update Fieldset Label
                    fs.find('legend').text(cat.ServiceAttributeCategoryName)
                        .attr('title', cat.ServiceAttributeCategoryName)
                        .attr('data-description', cat.ServiceAttributeCategoryDescription);


                    // Remove existing attributes
                    fs.find('>*:not(legend)').remove();

                    switch (cat.ServiceAttributeCategoryID) {
                        /*case 2:
                        case 3:
                        case 7:*/ 
                        default:
                            fs.append(createAttCheckList(cat));
                            break;
                        case 5:
                            // TODO: instead null, we need pass here the categoryID for language levels
                            fs.append(createAttCheckList(cat, null));
                            break;
                        case 1:
                        case 4:
                            fs.append(createAttSelect(cat));
                            break;
                    }

                    // Show it again
                    fs.show();
                });

                jAttributes.unblock();
                jActions.unblock();
            },
            error: function (jqXHR, errorText) {
                jAttributes.parent().unblock().block(errorBlock());
            }
        });
    }

    // Positions Load:
    //loadPositions();

    // First Attributes Load:
    if (jSelectPosition.length > 0)
        $.proxy(loadAttributes, jSelectPosition.get(0))();

    // Auto post back when select a position:
    jSelectPosition.change(loadAttributes);
};

$(document).ready(initYourWork);
$("#your-work").bind('endLoadWizardStep', initYourWork)
    .bind('endSubmitWizardStep', function (event, ok) { if (!ok) initYourWork(); });
