$(document).ready(function () {
    //aux function to get data from the url string
    function getURLParameter(name) {
        return decodeURI(
                   (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search) || [, null])[1]);
    }

    var isResult = (getURLParameter("EstimateResult") != "null") ? true : false;
    $("#advancer1").hide();
    $("#advancer2").hide();
    $('#pricingtype').hide();
    $('#pricingtypelabel').hide();
    $('#result').hide();

    //Get the position ID
    var positionID = getURLParameter("PositionID");
    if (positionID != "null" && !isResult) {
        $('#pricingtype').show();
        $('#pricingtypelabel').show();
        //Load the Pricing Type drop down
        $('#pricingtype').addOption(0, "Loading....").attr('disabled', true);
        $.getJSON('ListPricingTypes', function (data) {
            var estimatetypes = data;
            $.each(estimatetypes, function (index, estimatetype) {
                var val = estimatetype.PricingTypeID;
                var text = estimatetype.Description;
                $('#pricingtype').addOption(val, text, false);
            });

            $('#pricingtype').addOption(0, "Select type").attr('disabled', false);

            var firstselected = true;
            $('#pricingtype').change(function () {
                if (firstselected) {
                    firstselected = false;
                    $('#pricingtype').removeOption(0);
                };
            });

        });

        //Paint and load Estimate Var List
        //Check pricing type changes
        $('#pricingtype').change(
                function () {
                    var pricingTypeID = $('#pricingtype').val();

                    //Reset the form
                    $(".row").remove();
                    //Get estimation variables for the Position and pricing type.
                    $.getJSON('GetUserPricingVars', { PositionID: positionID, PricingTypeID: pricingTypeID },
                         function (data) {
                             var estimatevars = data;

                             //paint var tags(input/select)
                             $.each(estimatevars, function (index3, estimatevar) {
                                 var varID = estimatevar.EstimateVarID; //indentifies a variable value
                                 var groupID = estimatevar.GroupID; //identifies a variable group for radio lists and dropdowns
                                 var name = estimatevar.UserDescription; //description showed to the user
                                 var tag = estimatevar.UserTag; //Tells wich Html representation should be painted(simple input, radio list, dropdown)
                                 var value = estimatevar.Value; //Default value for the variable.
                                 //Paint simple input
                                 if (tag == "input") {
                                     if (!$('.label' + groupID).length) {
                                         $('.inputfields').after('<div class="row"><label class="label' + groupID + '" for="varValue"><b>' + name + '<b/></label><div/>');
                                     };
                                     $('.label' + groupID).after('<input type="hidden" id="varID" name="varID" value=' + varID + '>');
                                     $('.label' + groupID).after('<div class="row"><input class="inputValue" id="varValue" name="varValue" type="text"><div/>');
                                 };
                                 //Paint radio list input
                                 if (tag == "radiolist") {
                                     //If is the first element of the radio list add the label for the group
                                     if (!$('.label' + groupID).length) {
                                         $('.inputfields').after('<div class="row"><label class="label' + groupID + '" for="listValue"><b>' + name + '<b/></label><div/>');
                                         $('.label' + groupID).after('<input type="hidden" id="groupID" name="groupID" value=' + groupID + '>');
                                     };
                                     $('.label' + groupID).after('<div class="row"><label>' + value + '<label/><input type="radio" id="listValue" name="listValue" value=' + varID + '><div/>');
                                 };
                                 //Paint dropdown input
                                 if (tag == "dropdown") {
                                     //If is the first element of the dropdown add the label and the select tag for the group
                                     if (!$('.label' + groupID).length) {
                                         $('.inputfields').after('<div class="row"><label class="label' + groupID + '" for="varValue"><b>' + name + '<b/></label><div/>');
                                         $('.label' + groupID).after('<input type="hidden" id="groupID" name="groupID" value=' + groupID + '>');
                                         $('.label' + groupID).after('<div class="row"><select class=select' + groupID + ' name="listValue" id="listValue"/><div/>');
                                     };
                                     $('.select' + groupID).addOption(varID, value, false);
                                 };
                                 $("#advancer1").show();
                             });
                         }
                    );
                }
            );
    }
    //Paint the result retrived by the server
    if (isResult) {
        $("#message1").hide();
        $("#result").append(getURLParameter("EstimateResult") + ' $ (USD)');
        $("#result").show();
        $("#advancer2").show();
    }

});