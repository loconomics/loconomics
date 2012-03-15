$(document).ready(function(){

    // Auto post back when select a position:
    $('select[name=select-position]').change(function(){
    
        // TODO DAVE: Submit the form normally, meaning a full reload of the page (just when in a normal page the submit button is pressed, without ajax)
        //   Dave, If this is what you want, uncomment next line, and remove the code after next line because will be not needed, 
        //   categories and attributes must be 'printed' at server.
        //$('#provider-sign-up-your-work').submit();

        var selectedPosition = $(this).val();
        //console.info(selectedPosition);
        
        // No position:
        if (!selectedPosition || selectedPosition.length == 0){
            $('.service-attribute-category label, .service-attribute-category legend').hide();
            return;
        }
        selectedPosition = selectedPosition[0];
        
        // Clean previous attributes:
        var fieldsets = $('.service-attribute-category');
        fieldsets.find('label').remove();
        fieldsets.find('legend').text('');

        /* Template to create a label with checkbox, markers:
            {0} CategoryId
            {1} AttributeId
            {3} AttributeName
         */
        var tplAttribute = '<label><input name="positionservices-category[{0}]-attribute[{1}]" type="checkbox"/><span>{3}</span></label>';
                
        // Do the ajax to load attributes
        $.ajax({
            type: 'POST',
            url: 'GetAttributesForPosition?_PleaseChangeThis',
            data: { PositionID: selectedPosition },
            dataType: 'json', /* Dave, change this to the result type you use */
            success: function(data, textStatus, jqXHR){
                // TODO: use data to show attributes
                // Iterate categories?
                $.each(data, function(iCat, cat){
                    // I suppose will be something like this, not??
                    var catName = cat.CategoryName;
                    // Iterate category attributes?
                    $.each(cat.attributes, function(iAtt, att){
                        var hAtt = tplAttribute
                            .replace('{0}', cat.CategoryId)
                            .replace('{1}', att.AttributeId)
                            .replace('{2}', att.AttributeName);
    
                        // Add new attribute html to fieldset
                        fieldsets[iCat].prepend(hAtt);
                    });
                });
            }
        });
    });
});