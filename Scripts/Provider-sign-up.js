$(document).ready(function(){

    // Auto post back when select a position:
    $('select[name=select-position]').change(function(){
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
        $.getJSON('GetAttributesForPosition?_PleaseChangeThis', 
            { PositionID: selectedPosition }, function (data) {
            
            // TODO: use data to show attributes
            // Iterate categories?
            $.each(data, function(iCat, cat){
                // I suppose will be something like this, no??
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
            
        });
    });

});