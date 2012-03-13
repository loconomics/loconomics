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
        
        // Do the ajax to load attributes
        $.getJSON('GetAttributesForPosition?_PleaseChangeThis', 
            { PositionID: selectedPosition }, function (data) {
            
            // TODO: use data to show attributes
            $.each(data, function(index, item){
                // TODO 
            });
            
        });
    });

});