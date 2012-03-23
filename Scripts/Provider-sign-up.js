// public functions:
var public = {
    loadPositions: function(){}
};

$(document).ready(function(){

    var loadingBlock = {message: '<img src="' + BASE_URL + '/../img/loading.gif"/>'};
    var errorBlock = function(error, reload){ return {
        css: { cursor: 'default' },
        message: 'There was an error'
            + (error ? ': ' + error : '')
            + (reload ? ' <a href="javascript: ' + reload + ';">Click to reload</a>' : '')
    }};

    var jSelectPosition = $('select[name=select-position]');
    var jAttributes = $('.select-attributes');
    var jActions = $('fieldset.actions');
    $.blockUI.defaults.message = null;
    
    var loadPositions = public.loadPositions = function loadPositions(){
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
            url: 'GetPositions',
            dataType: 'json',
            success: function(data, textStatus, jqXHR){
                // Check result
                if (data.Result == -1) {
                    jSelectPosition.parent().unblock().block(errorBlock(data.ErrorMessage, 'public.loadPositions()'));
                    return;
                }

                // Iterate categories
                $.each(data.Positions, function(iPos, pos){
                    // Create and add the new option
                    jSelectPosition.append(tplOption
                        .replace('{0}', pos.PositionID)
                        .replace('{1}', pos.PositionSingular));
                });
                
                jSelectPosition.parent().unblock();
            },
            error: function(jqXHR, errorText){
                jSelectPosition.parent().unblock().block(errorBlock(null, 'public.loadPositions()'));
            }
        });
    }

    function loadAttributes(){
    
        var selectedPosition = $(this).val();
        
        // No position:
        if (!selectedPosition){
            jAttributes.block({overlayCSS:{cursor: 'default'}});
            jActions.block({overlayCSS:{cursor: 'default'}});
            return;
        }
        
        // Get dynamic fieldsets container:
        var fscontainer = $('.service-attribute-categories');

        /* Template to create a fieldset for attribute-category 
            {0} CategoryId
            {1} CategoryName
         */
        var tplCategory = '<fieldset class="service-attribute-category" id="service-attribute-category-{0}"><legend>{1}:</legend></fieldset>';
        /* Template to create a label with checkbox, markers:
            {0} CategoryId
            {1} AttributeId
            {3} AttributeName
         */
        var tplAttribute = '<label><input name="positionservices-category[{0}]-attribute[{1}]" type="checkbox"/><span>{2}</span></label>';

        // Locking elements and showing loading message
        jAttributes.block(loadingBlock);
        jActions.block();
        
        // Do the ajax to load attributes
        $.ajax({
            url: 'GetServiceAttributes',
            data: { positionId: selectedPosition },
            dataType: 'json',
            success: function(data, textStatus, jqXHR){

                // Check result
                if (data.Result == -1) {
                    jAttributes.unblock().block(errorBlock(data.ErrorMessage));
                    return;
                }

                // Iterate categories
                $.each(data.ServiceAttributeCategories, function(iCat, cat){
                    // Locate the category fieldset
                    var fs = $('#service-attribute-category-' + cat.ServiceAttributeCategoryID);
                    // Fieldset exists, update:
                    if (fs.length > 0){
                        return;
                        fs.find('legend').text(cat.ServiceAttributeCategoryName);
                        
                        // Iterate category attributes
                        $.each(cat.ServiceAttributes, function(iAtt, att){
                            var hAtt = tplAttribute
                                .replace('{0}', cat.ServiceAttributeCategoryID)
                                .replace('{1}', att.ServiceAttributeID)
                                .replace('{2}', att.ServiceAttribute);
    
                            // Add new attribute html to fieldset
                            fieldsets.eq(iCat).append(hAtt);
                        });
                    } else {
                        // Fieldset doesn't exist, create:
                        var jCat = $(tplCategory
                            .replace('{0}', cat.ServiceAttributeCategoryID)
                            .replace('{1}', cat.ServiceAttributeCategoryName));
                        
                        fscontainer.append(jCat);
                        
                        // Create Category Attributes checboxes:
                        // Iterate category attributes
                        $.each(cat.ServiceAttributes, function(iAtt, att){
                            var hAtt = tplAttribute
                                .replace('{0}', cat.ServiceAttributeCategoryID)
                                .replace('{1}', att.ServiceAttributeID)
                                .replace('{2}', att.ServiceAttribute);
    
                            // Add new attribute html to fieldset
                            jCat.append(hAtt);
                        });
                    }
                });
                
                jAttributes.unblock();
                jActions.unblock();
            },
            error: function(jqXHR, errorText){
                jAttributes.parent().unblock().block(errorBlock());
            }
        });
    }
    
    // Positions Load:
    loadPositions();
    
    // First Attributes Load:
    $.proxy(loadAttributes, jSelectPosition.get(0))();

    // Auto post back when select a position:
    jSelectPosition.change(loadAttributes);
});