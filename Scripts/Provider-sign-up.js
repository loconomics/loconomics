$(document).ready(function(){

    // Auto post back when select a position:
    $('select[name=select-position]').change(function(){
    
        var selectedPosition = $(this).val();
        
        // No position:
        if (!selectedPosition){
            $('.select-attributes').hide();
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
                
        // Do the ajax to load attributes
        $.ajax({
            type: 'POST',
            url: 'GetServiceAttributes',
            data: { positionId: selectedPosition },
            dataType: 'json',
            success: function(data, textStatus, jqXHR){

                // Check result
                if (data.Result == -1) {
                    // TODO An error happen!
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
                
                $('.select-attributes').show();
            }
        });
    });
});